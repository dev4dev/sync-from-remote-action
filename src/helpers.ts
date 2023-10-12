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
  const url = await execPromise(`git remote get-url origin`)
  return (await getRemoteVersion(url)).version
}

function extractVersionFromLogs(logs: string[]): VersionDetails {
  const matched = logs
    .flatMap(line => {
      const match = line.match(new RegExp('refs/tags/v?\\d+.\\d+.\\d+$'))
      if (match) {
        return match
      } else {
        return null
      }
    })
    .flatMap(x => (x ? [x] : []))
    .map(line => {
      const version = line.split(new RegExp('\\s'))?.pop()?.split('/')?.pop()
      const tag = line.split('\t').shift() ?? ''
      return {
        version: new SemVer(version ?? '0.0.0'),
        tag
      } as VersionDetails
    })
    .sort((lhs, rhs) => {
      return lhs.version.compare(rhs.version)
    })

  const result = matched.pop()

  if (result) {
    return result
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
