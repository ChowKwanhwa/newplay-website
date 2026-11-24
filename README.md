# NewPlay 官网

面向年轻人的数字娱乐空间。官网采用 Astro 静态页面，交互在浏览器内运行，Cloudflare Workers Static Assets 提供站点文件。

## 本地开发

使用 Node.js 22.23.4 或更高的受支持版本，在仓库根目录运行：

```sh
npm ci
npm run dev
```

构建与测试：

```sh
npm run build
npm test
npm run test:browser
```

浏览器测试使用本机 Google Chrome，覆盖 360、390、768、1024 和 1440 像素宽度。可以用 `npm run preview` 检查构建结果。

## 发布

`npm run deploy` 发布预览 Worker。`npm run deploy:production` 将同一份站点发布到已激活的 Cloudflare 域名区域。正式入口为 https://newplay.game，www 子域保留深层路径和查询参数并跳转到根域。

发布前需通过 Wrangler 在本机授权。部署记录与版本可用 `npx wrangler deployments list --env production` 查看；回退指定版本使用 `npx wrangler rollback <VERSION_ID> --env production`。

## 素材与演示

项目品牌和页面设计来自 NewPlay。字体原文件及各自的授权文本位于 `public/fonts/`，品牌视觉和项目代码的权利按权利人授权使用。付款、AI 生成、NC 余额和奖励示例均为公开演示。
