// import k0sManager from "./k0smanager";

// const k0s = new k0sManager()
// const container = k0s.dockerClient.getContainer("k0s-controller")

// k0s.runExecToString(container, {
//     AttachStderr: true,
//     AttachStdin: false,
//     AttachStdout: true,
//     Tty: true,
//     Privileged: true,
//     User: "root",
//     Cmd: ["echo", "coming from a container"]
// }).then(data => {
//     console.log("received data from exec:", data)
// })

// // k0s.createController().then((container) => {
// //     // const kc = k0s.getKubeConfig(container)
// //     // console.log(kc)
// //     //k0s.getKubeConfigViaExec(container)

// // })


import * as crypto from "crypto"

console.log(crypto.randomBytes(5).toString("hex"))