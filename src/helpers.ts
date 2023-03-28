import * as exec from '@actions/exec'
// import * as core from '@actions/core'
import {SemVer} from 'semver'

type VersionDetails = {
  version: SemVer
  tag: string
}

export async function getRemoteVersion(repo: string): Promise<VersionDetails> {
  const output = await execPromise(
    `git ls-remote --tags --sort="-v:refname" ${repo}`
  )
  const versions = output.split('\n')

  return extractVersionFromLogs(versions)
}

export async function getLocalVersion(): Promise<SemVer> {
  const output = await execPromise(`git tag --sort="-v:refname"`)
  const versions = output.split('\n')

  return extractVersionFromLogs(versions).version
}

function extractVersionFromLogs(logs: string[]): VersionDetails {
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

  if (matched) {
    const version = matched.split(new RegExp('\\s'))?.pop()?.split('/')?.pop()
    const tag = matched.split('\t').shift() ?? ''
    return {
      version: new SemVer(version ?? '0.0.0'),
      tag
    }
  } else {
    return {
      version: new SemVer('0.0.0'),
      tag: ''
    }
  }
}

export async function execPromise(command: string): Promise<string> {
  const result = await exec.getExecOutput(command, [])
  return result.stdout
}
