import * as core from '@actions/core'
import * as github from '@actions/github'
import * as exec from '@actions/exec'
import * as io from '@actions/io'
import * as glob from '@actions/glob'
import {getRemoteVersion, getLocalVersion} from './helpers'
import {env} from 'process'
import {gt} from 'semver'

const remoteRepoDirName = '__remote__source__'

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

    // Check if in test mode, we don't want to delete working files
    const repo = github.context.repo
    const path = `${repo.owner}/${repo.repo}`
    const testing = path === 'dev4dev/sync-from-remote-action'

    core.startGroup('Syncing...')
    // SYNC IF NEEDED

    // Delete nonhidden local files (??)
    const localItems = await glob.create('*', {
      implicitDescendants: false
    })
    for await (const file of localItems.globGenerator()) {
      core.info(`local > ${file}`)
    }

    // await io.rmRF('*')

    // // Clone remote repo
    // await exec.exec(`git clone ${source} ${remoteRepoDirName}`)
    // const rls = await exec.getExecOutput(`ls -ahl`, [], {
    //   cwd: remoteRepoDirName
    // })
    // core.info(`remote content ${rls.stdout}`)

    // // check local content
    // core.info(`local content ${(await exec.getExecOutput(`ls -ahl`)).stdout}`)

    // list remove non hidden files (glob)
    // const remoteItems = await glob.create('*')
    // for await (const file of remoteItems.globGenerator()) {
    //   core.info(`remote > ${file}`)
    // }

    // delete all hidden files
    // await io.rmRF(`./${remoteRepoDirName}/.*`)

    // // Copy remote nonhidden files (??)
    // await io.cp(`./${remoteRepoDirName}`, './', {
    //   recursive: true,
    //   force: true
    // })

    // // Delete parent repo
    // await io.rmRF(`./${remoteRepoDirName}`)

    // // git add --all && git commit with version name && git push
    // await exec.exec(`git add --all`)
    // await exec.exec(`git commot -m "${remoteVersion.format()}"`)
    // if (testing) {
    //   core.info((await exec.getExecOutput(`git status`)).stdout)
    //   core.info('> git push')
    // } else {
    //   await exec.exec(`git push`)
    // }

    core.endGroup()
    core.setOutput('synced', true)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
