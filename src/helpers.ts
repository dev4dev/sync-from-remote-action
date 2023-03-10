import * as exec from '@actions/exec'
// import * as core from '@actions/core'

export async function getRemoteVersion(repo: string): Promise<string> {
  return execPromise(
    `git ls-remote --tags --sort="-v:refname" ${repo} | grep -E "refs/tags/v?\\d+.\\d+.\\d+$"` // | head -n 1 | awk "{print $2}" | awk -F/ "{print $NF}"`
  )
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
