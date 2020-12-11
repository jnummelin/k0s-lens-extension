import k0sManager from "./k0smanager";

const k0s = new k0sManager()
k0s.createController().then((container) => {
    // const kc = k0s.getKubeConfig(container)
    // console.log(kc)
    k0s.getKubeConfigViaExec(container)
})
