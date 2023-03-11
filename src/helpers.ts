import * as exec from '@actions/exec'
// import * as core from '@actions/core'

export async function getRemoteVersion(
  repo: string
): Promise<string | undefined> {
  const output = await execPromise(
    `git ls-remote --tags --sort="-v:refname" ${repo}`
  )
  const versions = output.split('\n')

  return extractVersionFromLogs(versions)
}

export async function getLocalVersion(): Promise<string | undefined> {
  const output = await execPromise(`git tag --sort="-v:refname"`)
  const versions = output.split('\n')

  return extractVersionFromLogs(versions)
}

function extractVersionFromLogs(logs: string[]): string | undefined {
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
  return version
}

export async function execPromise(command: string): Promise<string> {
  const result = await exec.getExecOutput(command, [])
  return result.stdout
}
