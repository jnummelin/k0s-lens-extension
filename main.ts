import { LensMainExtension, LensRendererExtension, Store } from "@k8slens/extensions"
import Dockerode, { Volume } from "dockerode"
import k0sManager from "./k0smanager";

export default class K0sExtension extends LensMainExtension { 

  dockerClient: Dockerode

  appMenus = [
    {
      parentId: "file",
      id: "k0s",
      label: "Enable k0s cluster",
      click() {
        console.log("Create k0s cluster clicked")
        const k0s = new k0sManager()
        k0s.ensureWorkspace()

        k0s.ensureController()

        Store.workspaceStore.setActive("k0s")
      }
    },
  ]

  async onActivate(): Promise<void> {
    console.log("k0s extension activated 3")

    // Sync up clusters kubeconfig, if docker has been shutdown it might have changed
    let cluster = Store.clusterStore.clustersList.find((c) => c.contextName === "k0s-local")
    if (cluster) {
        // cluster.enabled = true
        const k0s = new k0sManager()
        await k0s.ensureController()
    }
    
  }

  

}

// export default class ExampleExtension extends LensRendererExtension {
//     clusterFeatures = [
//       {
//         title: "My Custom Feature",
//         components: {
//           Description: () => {
//             return (
//               <span>
//                 Just an example.
//               </span>
//             )
//           }
//         },
//         feature: new MyCustomFeature()
//       }
//     ]
//   }