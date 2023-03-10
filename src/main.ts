import * as core from '@actions/core'
import * as github from '@actions/github'
// import * as exec from '@actions/exec'

async function run(): Promise<void> {
  try {
    const source: string = core.getInput('source')

    core.startGroup('Test Group')
    core.info(`Syncing with the remote repo ${source}`)
    core.info(github.context.repo.repo)
    core.endGroup()

    core.setOutput('result', 'synced')
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
