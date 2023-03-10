import * as core from '@actions/core'
import * as github from '@actions/github'
// import * as exec from '@actions/exec'

async function run(): Promise<void> {
  try {
    const source: string = core.getInput('source')

    core.debug(`Syncing with the remote repo ${source}`)
    core.debug(github.context.repo.repo)

    console.log('Test nessage')

    core.setOutput('result', 'synced')
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
