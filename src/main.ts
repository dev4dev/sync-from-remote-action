import * as core from '@actions/core'
import * as github from '@actions/github'
import {getRemoteVersion, getLocalVersion} from './helpers'
import {env} from 'process'
import {gt} from 'semver'

async function run(): Promise<void> {
  try {
    const source: string = core.getInput('source')
    const githubToken = env['ACTIONS_RUNTIME_TOKEN'] as string
    const octokit = github.getOctokit(githubToken)
    // for (const [key, value] of Object.entries(env)) {
    //   core.info(`${key}: ${value}`)
    // }

    core.info(`${octokit}, ${source}`)

    // 0. Clone current repo

    // 1. Get remote version
    const remoteVersion = await getRemoteVersion(source)
    core.info(`Remote version: ${remoteVersion}`)

    // 2. Get local version
    const localVersion = await getLocalVersion()
    core.info(`Local version: ${localVersion}`)

    // 3. Compare version
    const needsSync = gt(remoteVersion, localVersion)
    core.info(`Needs sync: ${needsSync}`)

    // 4. SYNC IF NEEDED

    // 5. Clone remote repo

    // 6. Delete local files (except .github, .git, ...?)

    // 7. Copy remote files (except .github, .git)

    // 8. git add --all && git commit with version name && git push

    // core.startGroup('Test Group')
    // core.info(`Syncing with the remote repo ${source}`)
    // core.info(github.context.repo.repo)
    // core.endGroup()

    core.setOutput('result', 'synced')
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
