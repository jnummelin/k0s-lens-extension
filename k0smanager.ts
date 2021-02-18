import { KubeConfig } from "@kubernetes/client-node"
import { Store } from "@k8slens/extensions"
import Dockerode from "dockerode"
import * as fs from "fs"
import * as path from "path"
import yaml from "js-yaml";
import * as crypto from "crypto"


const kubeconfigFile = path.join(process.env.HOME, ".kube", "lens-k0s.conf")
const clusterStore = Store.clusterStore
const workspaceStore = Store.workspaceStore

const ICON_SVG_DATA = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNjIuMDM1IiBoZWlnaHQ9Ijc3LjkwNyIgdmlld0JveD0iMCAwIDI2Mi4wMzUgNzcuOTA3Ij48ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtODM2Ljc1NiAtODM4MS4zMDIpIj48cGF0aCBkPSJNNDIzLjkwNiwzOTYuMzRsLTM5LjYsMzEuMXYtMzEuMWgtMTUuNTV2NzcuNzRoMTUuNTVWNDQyLjk5MWwzOS4zNjEsMzEuMDg5aDIyLjgzOWwtNDYuNjUtMzcuOSw0Ni42NS0zOS44NFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQ2OCA3OTg1KSIgZmlsbD0iIzQyOGNjYiIvPjxwYXRoIGQ9Ik01NTIuOTgyLDM5Ni40djQ2LjY5aDYyLjI0OXYxNS41Nkg1NTIuOTgydjE1LjU2aDc3LjgxVjQyNy41M2gtNjIuMjRWNDExLjk1OWg2Mi4yNFYzOTYuNFoiIHRyYW5zZm9ybT0idHJhbnNsYXRlKDQ2OCA3OTg1KSIgZmlsbD0iIzAwMTAyMSIvPjxwYXRoIGQ9Ik01MDguNDEsNDE3LjkxMXYxOS41MWwtMTkuOTgsMTV2LTE5LjVaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0NjggNzk4NSkiIGZpbGw9IiM0MjhjY2IiLz48cGF0aCBkPSJNNTIxLjY3LDQyNy40NjFsLS4wMSwzMS4xSDQ4MC4yNWwtMjAuNjgsMTUuNTMxdi4wNjloNzcuN3YtNTguNDJaIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSg0NjggNzk4NSkiIGZpbGw9IiMwMDEwMjEiLz48cGF0aCBkPSJNNTM3LjE5LDM5Ni4zbC0yMC43NywxNS42SDQ3NS4xN3YzMC45NjlsLTE1LjYsMTEuNzIxVjM5Ni4zWiIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoNDY4IDc5ODUpIiBmaWxsPSIjNDI4Y2NiIi8+PC9nPjwvc3ZnPg=="

export default class k0sManager {
    dockerClient: Dockerode

    constructor() {
        this.dockerClient = new Dockerode()
    }



    async ensureController() {
        
        console.log("*** ensure controller")
        let container: Dockerode.Container
        if (! await this.isControllerRunning()) {
            container = await this.createController()
            
        } else {
            console.log("controller already running, getting the details")
            container = this.dockerClient.getContainer("k0s-controller")
        }
        await this.getKubeConfigViaExec(container)
        // if (! fs.existsSync(kubeconfigFile)) {
        //     console.log("k0s-local kubeconfig not existing, creating it")
        // } else {
        //     console.log("k0s-local kubeconfig already exists")
        // }
        const ws = this.ensureWorkspace()

        let cluster = this.findClusterById("k0s-local")
        if (! cluster) {
            console.log("creating k0s cluster object for Lens")
            cluster = clusterStore.addCluster({
                id: "k0s-local",
                kubeConfigPath: kubeconfigFile,
                contextName: "k0s-local",
                // ownerRef: "k0s-local",
                workspace: ws.id,
                preferences: {
                    clusterName: "k0s-local",
                    icon: ICON_SVG_DATA,
                }
              })
        }
        cluster.enabled = true
    }

    findClusterById(id: string): Store.Cluster {
        return clusterStore.clustersList.find((c) => c.ownerRef === id && c.contextName === id)
    }
    
    ensureWorkspace(): Store.Workspace {
        let workspace = workspaceStore.workspacesList.find((w) => w.id === "k0s")
        if (!workspace) {
          console.log("creating k0s workspace")
          workspace = workspaceStore.addWorkspace(new Store.Workspace({
            id: "k0s",
            name: "k0s",
            // ownerRef: "k0s-local"
          }))
        }
        // workspace.enabled = true
    
        return workspace
    }

    async isControllerRunning(): Promise<boolean> {
        try {
          const c = this.dockerClient.getContainer("k0s-controller")
          await c.inspect()
          console.log("found k0s-controller container")
          return true  
        } catch (error) {
          console.log("did NOT find k0s-controller container")
          return false
        }
    }
    
    async createController(): Promise<Dockerode.Container> {
        // await this.createVolume()
        // opts: Dockerode.ContainerCreateoptions = {
    
        // }
        console.log("starting to create the controller container")
        const container = await this.dockerClient.createContainer(
            {
                name: "k0s-controller",
                Image: "docker.io/k0sproject/k0s:latest",
                Hostname: "k0s-controller",
                ExposedPorts: {
                    "6443/tcp":{}
                },
                Volumes: {
                    // TODO: Use the real volume
                    "/var/lib/k0s": {}
                },
                HostConfig: {
                    RestartPolicy: {
                        Name: "always"
                    },
                    Privileged: true,
                    PortBindings: {
                        "6443/tcp": [
                            {
                                "HostIp": "",
                                "HostPort": ""
                            }
                        ]
                    },
                }
            }
        )
        console.log("container created, starting")
        await container.start()
        console.log("container started")

        return container
    }
    
    async createVolume() {
        const volumeOpts = {
          "Name": "k0s-controller",
          "Driver": "local"
        }
        return this.dockerClient.createVolume(volumeOpts)
    }

    async getKubeConfigViaExec(container:Dockerode.Container): Promise<KubeConfig> { 
        const execOpts: Dockerode.ExecCreateOptions = {
            AttachStderr: true,
            AttachStdin: false,
            AttachStdout: true,
            Tty: true,
            Privileged: true,
            User: "root",
            Cmd: ["/bin/sh", "-c", "while [ ! -f /var/lib/k0s/pki/admin.conf ]; do sleep 1; done && cat /var/lib/k0s/pki/admin.conf"]

        }
        const targetFile = path.join(process.env.HOME, ".kube", "lens-k0s.conf")
            
            
        //const output = fs.createWriteStream(targetFile)
        const rawKC = await this.runExecToString(container, execOpts)

        const kc = new KubeConfig()
        kc.loadFromString(rawKC)
        const port = await this.resolveExposedPort(container)
        const serverUrl = new URL(kc.clusters[0].server)
        serverUrl.port = port
      
        
        const modifiedKc = {
            apiVersion: "v1",
            kind: "Config",
            preferences: {},
            clusters: [
                {
                    name: "k0s-local",
                    cluster: {
                        server: serverUrl.toString(),
                        'insecure-skip-tls-verify': false,
                        'certificate-authority-data': kc.clusters[0].caData
                    }
                }
            ],
            users: [
                {
                    name: "admin",
                    user: {
                        'client-certificate-data': kc.users[0].certData,
                        'client-key-data': kc.users[0].keyData,
                    }
                }
            ],
            contexts: [
                {
                    name: "k0s-local",
                    context: {
                        cluster: "k0s-local",
                        namespace: "default",
                        user: "admin"
                    }
                }
            ],
            'current-context': "k0s-local",

        }

        const data = yaml.safeDump(modifiedKc, { skipInvalid: true })
        fs.writeFileSync(targetFile, data)

        return null
    }

    async resolveExposedPort(container: Dockerode.Container): Promise<string> {
        const info = await container.inspect()

        return info.NetworkSettings.Ports["6443/tcp"][0].HostPort
    }

    async runExecToString(container: Dockerode.Container, options: Dockerode.ExecCreateOptions): Promise<string> {
        return new Promise<string>((resolve, reject) => container.exec(options, function(err, exec) {
            if (err) {
              reject(err)
            }
            const execStartOpts: Dockerode.ExecStartOptions = {
              Tty: true,
              Detach: false
            }
            exec.start(execStartOpts, function(err, stream) {
              if (err) {
                reject(err)
              }
              
              const chunks:any = []
              stream.on('data', chunk => chunks.push(chunk))
              stream.on('error', err => reject(err))
              stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
            })
          }))
    }

    async addWorker() {
        const workerName = "k0s-worker-" + crypto.randomBytes(5).toString("hex")
        console.log("starting to create worker:", workerName)
        const token = await this.exec(["k0s", "token", "create", "--role=worker"])
        console.log("got token:", token)
        const container = await this.dockerClient.createContainer(
            {
                name: workerName,
                Image: "docker.io/k0sproject/k0s:latest",
                Hostname: workerName,
                Volumes: {
                    "/var/lib/k0s": {}
                },
                HostConfig: {
                    RestartPolicy: {
                        Name: "always"
                    },
                    Privileged: true,
                },
                Cmd: [
                    "k0s",
                    "worker",
                    token
                ]
            }
        )
        console.log("worker created, starting")
        await container.start()
        console.log("worker started")
    }

    async exec(cmd:string[]): Promise<string> {
        const container = this.dockerClient.getContainer("k0s-controller")
        return this.runExecToString(container, {
            AttachStderr: true,
            AttachStdin: false,
            AttachStdout: true,
            Tty: true,
            Privileged: true,
            User: "root",
            Cmd: cmd
        })
    }
}