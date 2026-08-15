. (Join-Path $PSScriptRoot 'relay-runner.ps1')
. (Join-Path $PSScriptRoot '../adapters/fake-adapter.ps1')

function New-RelayReplayContext([string]$FixturesRoot,[string]$ScriptPath,[string]$Root) {
  $definition=Read-RelayJson $ScriptPath
  $adapter=New-RelayFakeAdapter (Read-RelayJson (Join-Path $FixturesRoot $definition.adapter_script))
  $timeBox=@{now=[DateTimeOffset]::Parse('2026-08-15T09:00:00Z')}
  $clock={ $timeBox.now }.GetNewClosure()
  $run=New-RelayRun $Root $definition.run_id $adapter $clock
  @{
    fixtures_root=$FixturesRoot;definition=$definition;adapter=$adapter;run=$run;trace=[Collections.Generic.List[hashtable]]::new()
    tick=0;time_box=$timeBox
  }
}

function Get-RelayReplayFileHash([string]$Path) {
  if(Test-Path -LiteralPath $Path){(Get-FileHash -LiteralPath $Path).Hash}else{''}
}

function Invoke-RelayReplayTick([hashtable]$Context) {
  $Context.tick++
  $Context.time_box.now=[DateTimeOffset]::Parse('2026-08-15T09:00:00Z').AddSeconds($Context.tick*$Context.definition.tick_seconds)
  foreach($step in @($Context.definition.steps|Where-Object at_tick -eq $Context.tick)){
    $stateBefore=Get-RelayReplayFileHash $Context.run.paths.state
    $fixturePath=Join-Path $Context.fixtures_root $step.fixture
    if($step.action -ceq 'submit_proposal'){$result=Submit-RelayProposal $Context.run (Read-RelayJson $fixturePath) $step.expected_generation}
    elseif($step.action -ceq 'submit_result'){$result=Submit-RelayResultFile $Context.run $step.node $fixturePath}
    elseif($step.action -ceq 'submit_checkpoint'){$result=Submit-RelayCheckpointFile $Context.run $step.node $fixturePath}
    else{throw "unknown-replay-action:$($step.action)"}
    $stateAfter=Get-RelayReplayFileHash $Context.run.paths.state
    $currentResultHash=''
    if($step.ContainsKey('node') -and $Context.run.state.nodes.ContainsKey($step.node)){
      $attempt=$Context.run.state.nodes[$step.node].attempt_id
      if($attempt -gt 0){$currentResultHash=Get-RelayReplayFileHash (Join-Path $Context.run.paths.attempts "$($step.node)/$attempt/result.json")}
    }
    $Context.trace.Add(@{tick=$Context.tick;action=$step.action;node=if($step.ContainsKey('node')){$step.node}else{''};ok=[bool]$result.ok;reason=if($result.ContainsKey('reason')){$result.reason}else{''};state_hash_before=$stateBefore;state_hash_after=$stateAfter;current_result_hash_after=$currentResultHash})
  }
  foreach($id in @(Get-RelayReadyNodes $Context.run)){[void](Start-RelayNodeAttempt $Context.run $id)}
  [void](Invoke-RelayTick $Context.run)
  $Context
}

function Test-RelayReplayFinished([hashtable]$Context) {
  $remaining=@($Context.definition.steps|Where-Object at_tick -gt $Context.tick).Count
  $launched=@($Context.run.state.nodes.Values|Where-Object scheduling -eq 'launched').Count
  $ready=@(Get-RelayReadyNodes $Context.run).Count
  $remaining -eq 0 -and $launched -eq 0 -and $ready -eq 0
}

function Invoke-RelayReplay([string]$FixturesRoot,[string]$ScriptPath,[string]$Root) {
  $context=New-RelayReplayContext $FixturesRoot $ScriptPath $Root
  while($context.tick -lt $context.definition.max_ticks){
    [void](Invoke-RelayReplayTick $context)
    if(Test-RelayReplayFinished $context){break}
  }
  @{ticks=$context.tick;trace=@($context.trace);events=@(Read-RelayEvents $context.run);state=$context.run.state;adapter=$context.adapter;run=$context.run}
}

function Get-RelayEventSignature([hashtable[]]$Events,[switch]$SkipHeartbeat) {
  $signatures=[Collections.Generic.List[string]]::new()
  foreach($event in $Events){
    if($SkipHeartbeat -and $event.kind -ceq 'observation' -and -not $event.ContainsKey('reason')){continue}
    $node='-';$attempt='-';$reason='-'
    if($event.ContainsKey('identity') -and $event.identity.ContainsKey('node_id')){$node=$event.identity.node_id}
    if($event.ContainsKey('identity') -and $event.identity.ContainsKey('attempt_id')){$attempt=[string]$event.identity.attempt_id}
    if($event.ContainsKey('reason')){$reason=$event.reason}
    $signatures.Add("$($event.kind)|$node|$attempt|$reason")
  }
  $signatures.ToArray()
}
