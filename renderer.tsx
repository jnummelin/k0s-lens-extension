import { LensRendererExtension } from "@k8slens/extensions";
import { K0sIcon, K0sPage } from "./page"
import React from "react"

export default class K0sRedererExtension extends LensRendererExtension {
  globalPages = [
    {
      id: "k0s",
      components: {
        Page: () => <K0sPage extension={this}/>,
      }
    }
  ];

  globalPageMenus = [
    {
      target: { pageId: "k0s" },
      title: "k0s",
      components: {
        Icon: K0sIcon,
      }
    },
  ];
}