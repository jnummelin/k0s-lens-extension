import { LensRendererExtension, Component, Store } from "@k8slens/extensions";
import React from "react"
// import K0sLogo from "./k0s_logo.svg"
import k0sManager from "./k0smanager"


export function K0sIcon(props: Component.IconProps) {
  return <Component.Icon {...props} material="flaky" />
}

export class K0sPage extends React.Component<{ extension: LensRendererExtension }> {

  

  render() {
    return (
      <Component.PageLayout header={<h2>Local k0s management</h2>}>
          <h2>Manage local k0s cluster</h2>
          <Component.Button 
            primary
            label="Create"
            onClick={this.createCluster}
          />
          <Component.Button 
            label="Add worker"
            onClick={this.addWorker}
          />
      </Component.PageLayout>
    )
  }

  async createCluster() {
    console.log("create cluster")
    try {
        const k0s = new k0sManager()
        k0s.ensureWorkspace()
        await k0s.ensureController()
    
        Store.workspaceStore.setActive("k0s")

    } catch(err) {
        Component.Notifications.error(<span>Error while creating local k0s cluster: {String(err)}</span>)
    }
  }

  addWorker() {
    console.log("add worker")
}
}