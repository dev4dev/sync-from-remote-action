import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
    const source: string = core.getInput('source')

    core.debug(`Syncing with the remote repo ${source}`)
    core.debug(github.context.repo.repo)

    core.setOutput('time', new Date().toTimeString())
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
