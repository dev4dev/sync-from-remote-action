import * as exec from '@actions/exec'
// import * as core from '@actions/core'
import {SemVer} from 'semver'

export async function getRemoteVersion(repo: string): Promise<SemVer> {
  const output = await execPromise(
    `git ls-remote --tags --sort="-v:refname" ${repo}`
  )
  const versions = output.split('\n')

  return extractVersionFromLogs(versions)
}

export async function getLocalVersion(): Promise<SemVer> {
  // const output = await execPromise(`git tag --sort="-v:refname"`)
  // const versions = output.split('\n')

  // return extractVersionFromLogs(versions)
  return new SemVer('1.0.0')
}

function extractVersionFromLogs(logs: string[]): SemVer {
  const matched = logs
    .filter(line => {
      const match = line.match(new RegExp('refs/tags/v?\\d+.\\d+.\\d+$'))
      if (match) {
        return (match.index ?? 0) > 0
      } else {
        return false
      }
    })
    .shift()

  const version = matched?.split(new RegExp('\\s'))?.pop()?.split('/')?.pop()
  return new SemVer(version ?? '1.0.0')
}

export async function execPromise(command: string): Promise<string> {
  const result = await exec.getExecOutput(command, [])
  return result.stdout
}
