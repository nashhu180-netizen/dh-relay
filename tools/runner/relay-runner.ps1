. (Join-Path $PSScriptRoot 'relay-store.ps1')
. (Join-Path $PSScriptRoot '../contracts/relay-transitions.ps1')

function New-RelayNodeState {
  @{
    attempt_id=0; launch_id=''; session_id=''; terminal_state=''; result_status=''; final_committed=$false
    task_state='active'; scheduling='waiting'; frozen_by=@(); next_action=''; last_progress_at=''
    consecutive_probe_failures=0; launch_deadline_at=''; pause_reason=''
  }
}

function New-RelayRun([string]$Root, [string]$RunId, [hashtable]$Adapter, [scriptblock]$Clock, [hashtable]$Params = $null) {
  if ($null -eq $Params) { $Params = Import-PowerShellDataFile (Join-Path $PSScriptRoot '../contracts/relay-params.psd1') }
  $paths=Get-RelayRunPaths $Root $RunId
  foreach ($path in @($paths.root,$paths.plans,$paths.launches,$paths.attempts)) { [void](New-Item -ItemType Directory -Path $path -Force) }
  [IO.File]::WriteAllText($paths.events, '', [Text.UTF8Encoding]::new($false))
  $run=@{run_id=$RunId;paths=$paths;adapter=$Adapter;clock=$Clock;params=$Params;state=(New-RelayStateSnapshot $RunId)}
  [void](Save-RelayState $run); $run
}

function Open-RelayRun([string]$Root, [string]$RunId, [hashtable]$Adapter, [scriptblock]$Clock) {
  $paths=Get-RelayRunPaths $Root $RunId
  $state=Read-RelayJson $paths.state
  $check=Test-RelayStateSnapshot $state
  if(-not $check.ok){throw "state-invalid:$($check.reason)"}
  @{run_id=$RunId;paths=$paths;adapter=$Adapter;clock=$Clock;params=(Import-PowerShellDataFile (Join-Path $PSScriptRoot '../contracts/relay-params.psd1'));state=$state}
}

function Add-RelayProposalRejection([hashtable]$Run, [hashtable]$Proposal, [string]$Reason) {
  $identity=@{}
  if ($Proposal.plan_version -is [int] -or $Proposal.plan_version -is [long]) { $identity.plan_version=$Proposal.plan_version }
  if ($Proposal.plan_hash -is [string] -and $Proposal.plan_hash -match '^[0-9a-f]{64}$') { $identity.plan_hash=$Proposal.plan_hash }
  [void](Add-RelayEvent $Run 'plan_proposed' $identity $Reason)
  @{ok=$false;reason=$Reason}
}

function Test-RelayReplanCompatible([hashtable]$Run, [hashtable]$OldPlan, [hashtable]$NewPlan) {
  $newIds=@($NewPlan.nodes.node_id)
  foreach ($old in $OldPlan.nodes) {
    if ($old.node_id -cnotin $newIds) { return @{ok=$false;node_id=$old.node_id} }
    $new=@($NewPlan.nodes | Where-Object node_id -CEQ $old.node_id)[0]
    if ($new.role -cne $old.role -or $new.brief_ref -cne $old.brief_ref -or $new.next_action -cne $old.next_action) { return @{ok=$false;node_id=$old.node_id} }
    foreach ($dep in @($old.depends_on)) { if ($dep -cnotin @($new.depends_on)) { return @{ok=$false;node_id=$old.node_id} } }
    foreach ($dep in @($new.depends_on)) { if ($dep -cnotin @($old.depends_on) -and $dep -cin @($OldPlan.nodes.node_id)) { return @{ok=$false;node_id=$old.node_id} } }
    if ($new.ContainsKey('resume_from')) {
      $oldState=$Run.state.nodes[$old.node_id]
      if ($new.resume_from.node_id -cne $old.node_id -or $oldState.scheduling -cne 'blocked' -or $new.resume_from.attempt_id -ne $oldState.attempt_id) { return @{ok=$false;node_id=$old.node_id} }
    }
  }
  @{ok=$true}
}

function Submit-RelayProposal([hashtable]$Run, [hashtable]$Proposal, [int]$ExpectedGeneration) {
  $schema=Test-RelayPlanProposal $Proposal
  if (-not $schema.ok) { return Add-RelayProposalRejection $Run $Proposal "proposal-rejected:$($schema.reason)" }
  if ($Proposal.run_id -cne $Run.run_id) { return Add-RelayProposalRejection $Run $Proposal 'proposal-rejected:wrong-run' }
  if ($Run.state.authority_generation -ne $ExpectedGeneration) { return Add-RelayProposalRejection $Run $Proposal 'proposal-rejected:cas-conflict' }
  if ($Proposal.plan_version -ne ($Run.state.plan_version + 1)) { return Add-RelayProposalRejection $Run $Proposal 'proposal-rejected:plan-version-not-next' }
  $expectedProposer=if ($Run.state.plan_version -eq 0) {'orchestrator'} else {'replanner'}
  if ($Proposal.proposed_by -cne $expectedProposer) { return Add-RelayProposalRejection $Run $Proposal 'proposal-rejected:wrong-proposer' }
  if ($Run.state.plan_version -gt 0) {
    $compat=Test-RelayReplanCompatible $Run (Read-RelayActivePlanBody $Run) $Proposal
    if (-not $compat.ok) { return Add-RelayProposalRejection $Run $Proposal "proposal-rejected:replan-incompatible:$($compat.node_id)" }
  }
  $candidateState=$Run.state|ConvertTo-Json -Depth 100 -Compress|ConvertFrom-Json -AsHashtable -DateKind String
  $generation=$candidateState.authority_generation+1
  $candidateState.plan_version=$Proposal.plan_version;$candidateState.plan_hash=$Proposal.plan_hash;$candidateState.authority_generation=$generation;$candidateState.replan_required=$false
  foreach ($node in $Proposal.nodes) {
    if (-not $candidateState.nodes.ContainsKey($node.node_id)) { $candidateState.nodes[$node.node_id]=New-RelayNodeState }
    elseif ($candidateState.nodes[$node.node_id].scheduling -ceq 'blocked') { $candidateState.nodes[$node.node_id].scheduling='waiting';$candidateState.nodes[$node.node_id].task_state='active';$candidateState.nodes[$node.node_id].pause_reason='' }
  }
  $stateCheck=Test-RelayStateSnapshot $candidateState
  if(-not $stateCheck.ok){return Add-RelayProposalRejection $Run $Proposal 'proposal-rejected:state-invalid'}
  $proposalPath=Join-Path $Run.paths.plans "relay-plan.v$($Proposal.plan_version).proposal.json"
  $created=Write-RelayJsonCreateNew $proposalPath $Proposal
  if (-not $created.ok) {
    $existing=Read-RelayJson $proposalPath
    if ($existing.plan_hash -cne $Proposal.plan_hash) { return Add-RelayProposalRejection $Run $Proposal 'proposal-rejected:proposal-immutable' }
  }
  $now=(& $Run.clock).ToString('o')
  $authority=@{schema_version='relay/v1';run_id=$Run.run_id;authority_generation=$generation;plan_version=$Proposal.plan_version;plan_hash=$Proposal.plan_hash;granted_at=$now}
  $active=@{schema_version='relay/v1';plan_version=$Proposal.plan_version;plan_hash=$Proposal.plan_hash;authority_generation=$generation;activated_at=$now}
  if (-not (Test-RelayAuthority $authority).ok) { throw 'authority-invalid' }
  if (-not (Test-RelayActivePlan $active).ok) { throw 'active-plan-invalid' }
  [void](Write-RelayJsonAtomic $Run.paths.authority $authority); [void](Write-RelayJsonAtomic $Run.paths.active_plan $active)
  $Run.state=$candidateState
  [void](Save-RelayState $Run)
  $planIdentity=@{plan_version=$Proposal.plan_version;plan_hash=$Proposal.plan_hash}
  [void](Add-RelayEvent $Run 'plan_proposed' $planIdentity)
  $activeIdentity=$planIdentity.Clone(); $activeIdentity.authority_generation=$generation
  [void](Add-RelayEvent $Run 'plan_activated' $activeIdentity)
  @{ok=$true;authority_generation=$generation}
}

function Get-RelayReadyNodes([hashtable]$Run) {
  if ($Run.state.replan_required -or $Run.state.plan_version -eq 0) { return @() }
  $plan=Read-RelayActivePlanBody $Run; $ready=[Collections.Generic.List[string]]::new()
  foreach ($node in $plan.nodes) {
    $state=$Run.state.nodes[$node.node_id]
    if ($state.scheduling -cne 'waiting' -or $state.task_state -cne 'active' -or @($state.frozen_by).Count -gt 0) { continue }
    $depsReady=$true
    foreach ($dep in @($node.depends_on)) { if ($Run.state.nodes[$dep].scheduling -cne 'succeeded') { $depsReady=$false; break } }
    if ($depsReady) { $ready.Add($node.node_id) }
  }
  if ($ready.Count -eq 0) { return @() }
  return $ready.ToArray()
}

function Start-RelayNodeAttempt([hashtable]$Run, [string]$NodeId) {
  if ($NodeId -cnotin @(Get-RelayReadyNodes $Run)) { return @{ok=$false;reason='node-not-ready'} }
  $plan=Read-RelayActivePlanBody $Run; $planNode=@($plan.nodes | Where-Object node_id -CEQ $NodeId)[0]; $node=$Run.state.nodes[$NodeId]
  $Run.state.launch_seq++; $seq=$Run.state.launch_seq; $launchId='L-{0:d4}' -f $seq; $sessionId='S-{0:d4}' -f $seq; $attemptId=$node.attempt_id+1
  $now=& $Run.clock; $deadline=$now.AddSeconds($Run.params.LaunchDeadlineSeconds)
  $receipt=@{schema_version='relay/v1';plan_version=$Run.state.plan_version;plan_hash=$Run.state.plan_hash;authority_generation=$Run.state.authority_generation;node_id=$NodeId;attempt_id=$attemptId;launch_id=$launchId;session_id=$sessionId;role=$planNode.role;backend=$Run.adapter.backend;issued_at=$now.ToString('o');launch_deadline_at=$deadline.ToString('o')}
  if (-not (Test-RelayLaunchReceipt $receipt).ok) { throw 'receipt-invalid' }
  $written=Write-RelayJsonCreateNew (Join-Path $Run.paths.launches "$launchId.json") $receipt
  if (-not $written.ok) { throw 'receipt-exists' }
  [void](New-Item -ItemType Directory -Path (Join-Path $Run.paths.attempts "$NodeId/$attemptId") -Force)
  $node.attempt_id=$attemptId; $node.launch_id=$launchId; $node.session_id=$sessionId; $node.terminal_state='launching'; $node.result_status='working'; $node.final_committed=$false; $node.task_state='active'; $node.scheduling='launched'; $node.last_progress_at=$now.ToString('o'); $node.consecutive_probe_failures=0; $node.launch_deadline_at=$deadline.ToString('o'); $node.pause_reason=''
  [void](Save-RelayState $Run)
  $identity=@{plan_version=$receipt.plan_version;plan_hash=$receipt.plan_hash;authority_generation=$receipt.authority_generation;node_id=$NodeId;attempt_id=$attemptId;launch_id=$launchId;session_id=$sessionId}
  [void](Add-RelayEvent $Run 'launch_receipt' $identity)
  $launched=& $Run.adapter.launch $receipt $planNode $Run
  if (-not $launched.ok -or $launched.session_id -cne $sessionId) {
    $reason=if ($launched.ok) {'launch-handle-mismatch'} else {"adapter-launch-failed:$($launched.reason)"}
    $move=Test-RelayTerminalTransition $node.terminal_state 'unknown'; if (-not $move.ok) { throw 'launch-failure-transition-invalid' }
    $node.terminal_state='unknown'; $node.task_state='paused'; $node.scheduling='paused'; $node.pause_reason='launch-failed'; [void](Save-RelayState $Run)
    [void](Add-RelayEvent $Run 'launch_failed' $identity $reason)
    return @{ok=$false;reason=$reason}
  }
  @{ok=$true;launch_id=$launchId;session_id=$sessionId;attempt_id=$attemptId}
}

function Get-RelayNodeIdentity([hashtable]$Run, [string]$NodeId) {
  $node=$Run.state.nodes[$NodeId]
  @{plan_version=$Run.state.plan_version;plan_hash=$Run.state.plan_hash;authority_generation=$Run.state.authority_generation;node_id=$NodeId;attempt_id=$node.attempt_id;launch_id=$node.launch_id;session_id=$node.session_id}
}

function Get-RelayValueIdentity([hashtable]$Value) {
  $identity=@{}
  foreach($key in @('plan_version','plan_hash','authority_generation','node_id','attempt_id','launch_id','session_id')) {
    if($Value.ContainsKey($key)){$identity[$key]=$Value[$key]}
  }
  $identity
}

function Set-RelayNodePaused([hashtable]$Run,[string]$NodeId,[string]$Reason) {
  $node=$Run.state.nodes[$NodeId];$node.task_state='paused';$node.scheduling='paused';$node.pause_reason=$Reason
  [void](Save-RelayState $Run)
}

function Apply-RelayObservation([hashtable]$Run,[string]$NodeId,[hashtable]$Obs) {
  $node=$Run.state.nodes[$NodeId]
  if($node.scheduling -cnotin @('launched','blocked')){return @{ok=$false;reason='node-not-observable'}}
  $identity=Get-RelayNodeIdentity $Run $NodeId
  if($Obs.probe_error){
    $node.consecutive_probe_failures++
    if($node.final_committed){[void](Save-RelayState $Run);[void](Add-RelayEvent $Run 'observation' $identity '' @{probe_error=$true;consecutive_probe_failures=$node.consecutive_probe_failures;terminal_state=$node.terminal_state});return @{ok=$false;reason='probe-error'}}
    $verdict=Get-RelayProbeVerdict $node.consecutive_probe_failures $Run.params $node.terminal_state $node.result_status
    if($verdict.triggered){
      $pair=Test-RelayTransitionPair $verdict.terminal_move $verdict.result_move
      if(-not $pair.ok){$node.task_state='paused';$node.scheduling='paused';$node.pause_reason='probe-lost';[void](Save-RelayState $Run);[void](Add-RelayEvent $Run 'observation' $identity '' @{probe_error=$true;consecutive_probe_failures=$node.consecutive_probe_failures;terminal_state=$node.terminal_state});[void](Add-RelayEvent $Run 'observation' $identity $pair.reason @{terminal_state=$node.terminal_state});return @{ok=$false;reason=$pair.reason}}
      $node.terminal_state=$verdict.terminal_move.to;$node.result_status=$verdict.result_move.to;$node.task_state='paused';$node.scheduling='paused';$node.pause_reason='probe-lost'
    }
    [void](Save-RelayState $Run)
    [void](Add-RelayEvent $Run 'observation' $identity '' @{probe_error=$true;consecutive_probe_failures=$node.consecutive_probe_failures;terminal_state=$node.terminal_state})
    return @{ok=$false;reason='probe-error'}
  }
  $node.consecutive_probe_failures=0;$observed=[string]$Obs.terminal_state
  if($observed -ceq $node.terminal_state){
    [void](Save-RelayState $Run);[void](Add-RelayEvent $Run 'observation' $identity '' @{terminal_state=$observed});return @{ok=$true}
  }
  $move=Test-RelayTerminalTransition $node.terminal_state $observed
  if(-not $move.ok){
    $reason="transition-rejected:$($move.reason)";if(-not $node.final_committed){$node.task_state='paused';$node.scheduling='paused';$node.pause_reason='illegal-terminal-transition'};[void](Save-RelayState $Run);[void](Add-RelayEvent $Run 'observation' $identity $reason @{terminal_state=$node.terminal_state});return @{ok=$false;reason=$reason}
  }
  $node.terminal_state=$observed;$node.last_progress_at=(& $Run.clock).ToString('o');[void](Save-RelayState $Run);[void](Add-RelayEvent $Run 'observation' $identity '' @{terminal_state=$observed})
  if($observed -ceq 'exited' -and -not $node.final_committed){
    $exit=Get-RelayExitWithoutResultVerdict @{terminal_state='exited';result_status=$node.result_status;final_result=$null}
    if($exit.triggered){$resultMove=Test-RelayResultTransition $exit.result_move.from $exit.result_move.to;if($resultMove.ok){$node.result_status='interrupted_unknown'}}
    Set-RelayNodePaused $Run $NodeId 'exit-without-result'
  }
  @{ok=$true}
}

function Invoke-RelayTick([hashtable]$Run) {
  $now=& $Run.clock;$probed=[Collections.Generic.List[string]]::new()
  $hostItems=@(& $Run.adapter.emit_observation $Run)
  foreach($obs in $hostItems){
    $match=@($Run.state.nodes.Keys|Where-Object{$Run.state.nodes[$_].session_id -ceq $obs.session_id})
    if($match.Count -eq 1){[void](Apply-RelayObservation $Run $match[0] @{ok=$true;terminal_state=$obs.terminal_state;probe_error=$false})}
  }
  $activePlan=if($null -eq (Read-RelayActivePlan $Run)){$null}else{Read-RelayActivePlanBody $Run}
  $nodeOrder=if($null -ne $activePlan){@($activePlan.nodes.node_id)}else{@($Run.state.nodes.Keys|Sort-Object)}
  foreach($nodeId in $nodeOrder){
    $node=$Run.state.nodes[$nodeId]
    if($node.scheduling -cnotin @('launched','blocked') -or $node.terminal_state -ceq 'exited'){continue}
    $obs=& $Run.adapter.probe $node.session_id;$probed.Add($nodeId);[void](Apply-RelayObservation $Run $nodeId $obs)
    $node=$Run.state.nodes[$nodeId]
    if($node.scheduling -eq 'launched' -and $node.terminal_state -ceq 'launching' -and $now -ge [DateTimeOffset]::Parse($node.launch_deadline_at)){
      $move=Test-RelayTerminalTransition 'launching' 'unknown';if(-not $move.ok){throw 'launch-deadline-transition-invalid'}
      $node.terminal_state='unknown';[void](Save-RelayState $Run);[void](Add-RelayEvent $Run 'launch_failed' (Get-RelayNodeIdentity $Run $nodeId) 'launch-deadline-exceeded');Set-RelayNodePaused $Run $nodeId 'launch-deadline-exceeded';continue
    }
    if($node.scheduling -eq 'launched' -and $node.result_status -cne 'decision_required'){
      $stall=Get-RelayStallVerdict @{terminal_state=$node.terminal_state;result_status=$node.result_status;last_event_at=$node.last_progress_at} $now $Run.params
      if($stall.stalled){
        $pair=Test-RelayTransitionPair $stall.terminal_move $stall.result_move
        if(-not $pair.ok){throw 'stall-transition-invalid'}
        $node.terminal_state=$stall.terminal_move.to;$node.result_status=$stall.result_move.to
        [void](Save-RelayState $Run);[void](Add-RelayEvent $Run 'observation' (Get-RelayNodeIdentity $Run $nodeId) 'stall-threshold-exceeded' @{terminal_state='unknown'});Set-RelayNodePaused $Run $nodeId 'stalled'
      }
    }
  }
  @{now=$now;probed=@($probed)}
}

function Submit-RelayResultFile([hashtable]$Run,[string]$NodeId,[string]$Path) {
  if(-not $Run.state.nodes.ContainsKey($NodeId)){return @{ok=$false;reason='unknown-node'}}
  $node=$Run.state.nodes[$NodeId];$currentIdentity=Get-RelayNodeIdentity $Run $NodeId
  if($node.attempt_id -eq 0){[void](Add-RelayEvent $Run 'result_rejected' @{} 'no-attempt');return @{ok=$false;reason='no-attempt'}}
  try{$value=Read-RelayJson $Path}catch{[void](Add-RelayEvent $Run 'result_rejected' $currentIdentity 'unparseable-result');return @{ok=$false;reason='unparseable-result'}}
  $current=@{node_id=$NodeId;attempt_id=$node.attempt_id;launch_id=$node.launch_id;session_id=$node.session_id;final_committed=$node.final_committed}
  $verdict=Get-RelayResultVerdict $value (Read-RelayAuthority $Run) (Read-RelayActivePlan $Run) $current
  if($verdict.verdict -cne 'accept'){
    $kind=if($verdict.verdict -ceq 'stale' -or $verdict.reason -cin @('stale-plan','stale-generation')){'result_stale'}else{'result_rejected'}
    [void](Add-RelayEvent $Run $kind (Get-RelayValueIdentity $value) $verdict.reason);return @{ok=$false;verdict=$verdict.verdict;reason=$verdict.reason}
  }
  $transition=Test-RelayResultTransition $node.result_status $value.result_status
  if(-not $transition.ok){
    [void](Add-RelayEvent $Run 'result_rejected' (Get-RelayValueIdentity $value) $transition.reason)
    if($transition.reason -ceq 'reserved-target-form' -and $value.result_status -ceq 'quota_exhausted'){
      $fallback=Test-RelayResultTransition $node.result_status 'interrupted_unknown'
      if(-not $fallback.ok){throw 'quota-fallback-transition-invalid'}
      $node.result_status='interrupted_unknown';Set-RelayNodePaused $Run $NodeId 'quota-fallback'
    }
    return @{ok=$false;reason=$transition.reason}
  }
  $resultPath=Join-Path $Run.paths.attempts "$NodeId/$($node.attempt_id)/result.json";$written=Write-RelayJsonCreateNew $resultPath $value
  if(-not $written.ok){[void](Add-RelayEvent $Run 'result_rejected' (Get-RelayValueIdentity $value) 'final-immutable');return @{ok=$false;reason='final-immutable'}}
  $node.final_committed=$true;$node.result_status=$value.result_status;$node.next_action=$value.next_action;$node.last_progress_at=(& $Run.clock).ToString('o')
  foreach($other in $Run.state.nodes.Values){$other.frozen_by=@($other.frozen_by|Where-Object{$_ -cne $NodeId})}
  if($value.result_status -ceq 'succeeded'){$node.scheduling='succeeded'}
  elseif($value.result_status -ceq 'dependency_blocked'){
    $node.scheduling='blocked';$Run.state.replan_required=$true;[void](Save-RelayState $Run);[void](Add-RelayEvent $Run 'result_accepted' (Get-RelayValueIdentity $value));$stopped=& $Run.adapter.stop $node.session_id
    if(-not $stopped.ok){[void](Add-RelayEvent $Run 'observation' (Get-RelayNodeIdentity $Run $NodeId) "stop-failed:$($stopped.reason)" @{terminal_state=$node.terminal_state})}
    return @{ok=$true;result_status=$value.result_status}
  }elseif($value.result_status -ceq 'interrupted_unknown'){
    $node.task_state='paused';$node.scheduling='paused';$node.pause_reason='worker-reported-interruption'
  }
  [void](Save-RelayState $Run);[void](Add-RelayEvent $Run 'result_accepted' (Get-RelayValueIdentity $value));@{ok=$true;result_status=$value.result_status}
}

function Submit-RelayCheckpointFile([hashtable]$Run,[string]$NodeId,[string]$Path) {
  if(-not $Run.state.nodes.ContainsKey($NodeId)){return @{ok=$false;reason='unknown-node'}}
  $node=$Run.state.nodes[$NodeId];$currentIdentity=Get-RelayNodeIdentity $Run $NodeId
  if($node.attempt_id -eq 0){[void](Add-RelayEvent $Run 'checkpoint_rejected' @{} 'no-attempt');return @{ok=$false;reason='no-attempt'}}
  try{$value=Read-RelayJson $Path}catch{[void](Add-RelayEvent $Run 'checkpoint_rejected' $currentIdentity 'unparseable-checkpoint');return @{ok=$false;reason='unparseable-checkpoint'}}
  $current=@{node_id=$NodeId;attempt_id=$node.attempt_id;launch_id=$node.launch_id;session_id=$node.session_id;final_committed=$node.final_committed}
  $verdict=Get-RelayCheckpointVerdict $value (Read-RelayAuthority $Run) (Read-RelayActivePlan $Run) $current
  if($verdict.verdict -cne 'accept'){[void](Add-RelayEvent $Run 'checkpoint_rejected' (Get-RelayValueIdentity $value) $verdict.reason);return @{ok=$false;verdict=$verdict.verdict;reason=$verdict.reason}}
  $old=$node.result_status
  if($value.status -cne $old){
    $transition=Test-RelayResultTransition $old $value.status
    if(-not $transition.ok){[void](Add-RelayEvent $Run 'checkpoint_rejected' (Get-RelayValueIdentity $value) $transition.reason);return @{ok=$false;reason=$transition.reason}}
    $node.result_status=$value.status
  }
  if($value.status -ceq 'decision_required'){
    $plan=Read-RelayActivePlanBody $Run
    foreach($id in @(Get-RelayNodeFreezeSet $plan $NodeId)){if($NodeId -cnotin @($Run.state.nodes[$id].frozen_by)){$Run.state.nodes[$id].frozen_by+=@($NodeId)}}
  }elseif($old -ceq 'decision_required'){
    foreach($other in $Run.state.nodes.Values){$other.frozen_by=@($other.frozen_by|Where-Object{$_ -cne $NodeId})}
  }
  [void](Write-RelayJsonAtomic (Join-Path $Run.paths.attempts "$NodeId/$($node.attempt_id)/checkpoint.json") $value)
  $node.last_progress_at=(& $Run.clock).ToString('o');[void](Save-RelayState $Run);[void](Add-RelayEvent $Run 'checkpoint_accepted' (Get-RelayValueIdentity $value));@{ok=$true;status=$value.status}
}
