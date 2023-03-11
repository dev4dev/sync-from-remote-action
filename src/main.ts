import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'
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
    // uses: actions/checkout@v3

    core.startGroup('Precheck')
    // 1. Get remote version
    const remoteVersion = await getRemoteVersion(source)
    core.info(`Remote version: ${remoteVersion}`)

    // 2. Get local version
    const localVersion = await getLocalVersion()
    core.info(`Local version: ${localVersion}`)

    // 3. Compare version
    const needsSync = gt(remoteVersion, localVersion)
    core.info(`Needs sync: ${needsSync}`)
    core.endGroup()

    if (!needsSync) {
      core.setOutput('synced', false)
      return
    }

    core.startGroup('Syncing...')
    // SYNC IF NEEDED

    // 4. Clone remote repo
    await exec.exec(`git clone ${source} __remote__source__`)
    const ls = await exec.getExecOutput(`ls -ahl`, [], {
      cwd: '__remote__source__'
    })
    core.info(`remote content ${ls.stdout}`)

    // 5. Delete local files (except .github, .git, ...?)

    // 6. Copy remote files (except .github, .git)

    // 7. git add --all && git commit with version name && git push

    // core.startGroup('Test Group')
    // core.info(`Syncing with the remote repo ${source}`)
    // core.info(github.context.repo.repo)
    // core.endGroup()

    core.endGroup()
    core.setOutput('synced', true)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
