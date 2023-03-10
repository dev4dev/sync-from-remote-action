import * as exec from '@actions/exec'
// import * as core from '@actions/core'

export async function getRemoteVersion(
  repo: string
): Promise<string | undefined> {
  const output = await execPromise(
    `bash -c "git ls-remote --tags --sort='-v:refname' ${repo}`
  )
  const versions = output.split('\n')

  const matched = versions
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

export async function getLocalVersion(): Promise<string> {
  return execPromise('git --version')
}

export async function execPromise(command: string): Promise<string> {
  const result = await exec.getExecOutput(command, [])
  return result.stdout
  // return new Promise<string>((resolve, reject) => {
  //   exec.exec(command, [], {
  //     listeners: {
  //       stdout: data => {
  //         core.info(`stdout: ${data.toString('utf8')}`)
  //         resolve(data.toString())
  //       },
  //       stderr: data => {
  //         core.info(`error: ${data.toString('utf8')}`)
  //         reject(data.toString())
  //       },
  //       stdline(data) {
  //         core.info(`stdline: ${data}`)
  //       }
  //     }
  //   })
  // })
}
