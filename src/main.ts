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
    const allLocal = await localItems.glob()
    const visibleLocal = allLocal.filter(file => {
      const parts = file.split('/')
      const hidden = parts.pop()?.startsWith('.') ?? false
      return !hidden
    })

    core.info('Removing local stuff...')
    for (const file of visibleLocal) {
      core.info(`Deleting ${file}...`)
      await io.rmRF(file)
    }

    // check local content
    core.info(`local content ${(await exec.getExecOutput(`ls -ahl`)).stdout}`)

    // Clone remote repo
    await exec.exec(`git clone ${source} ${remoteRepoDirName}`)
    const rls = await exec.getExecOutput(`ls -ahl`, [], {
      cwd: remoteRepoDirName
    })
    core.info(`remote content ${rls.stdout}`)

    // Copy remote files
    const remoteItems = await glob.create(`./${remoteRepoDirName}/*`, {
      implicitDescendants: false
    })
    const allRemote = await remoteItems.glob()
    const visibleRemote = allRemote.filter(file => {
      const parts = file.split('/')
      const hidden = parts.pop()?.startsWith('.') ?? false
      return !hidden
    })
    core.info('Copying remote files...')
    for (const file of visibleRemote) {
      core.info(`Copying ${file}...`)
      await io.cp(file, './', {
        recursive: true,
        force: true
      })
    }

    // Delete parent repo
    await io.rmRF(`./${remoteRepoDirName}`)

    // check local content
    core.info(`local content ${(await exec.getExecOutput(`ls -ahl`)).stdout}`)

    // setup git
    // const gitEmail: string = core.getInput('gitEmail')
    // const gitName: string = core.getInput('gitName')
    // await exec.exec(`git config --global user.email "${gitEmail}"`)
    // await exec.exec(`git config --global user.name "${gitName}"`)

    // // git add --all && git commit with version name && git push
    // await exec.exec(`git add --all`)
    // await exec.exec(`git commit -m "${remoteVersion.format()}"`)
    // await exec.exec(`git tag ${remoteVersion.format()}`)
    // if (testing) {
    //   core.info((await exec.getExecOutput(`git status`)).stdout)
    //   core.info((await exec.getExecOutput(`git log --format=oneline`)).stdout)
    //   core.info('> git push')
    // } else {
    //   await exec.exec(`git push`)
    //   await exec.exec(`git push --tags`)
    // }

    core.endGroup()
    core.setOutput('synced', true)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
