---
icon: webpack
---



# 如何修复[@types/webpack] 'devServer' does not exist in type 'Configuration'

对于前端代码的编写，我比较推崇[TypeScript](https://www.typescriptlang.org/)，并且既然用了TypeScript，我们就需要把任何变量的类型写全了，而不是偷懒使用`any`。

今天遇到一个问题，使用TypeScript语法来配置webpack时，提示是：

````console
'"devServer"' does not exist in type 'Configuration'
````

![Screenshot2022-03-14-23](https://cdn.jsdelivr.net/gh/wuliang142857/pictures-hosting@main/20220314/Screenshot2022-03-14-23.4kkasqyb5oo0.png)

尝试解决一下：

````typescript
import { Configuration as WebpackConfiguration } from "webpack";
import { Configuration as WebpackDevServerConfiguration } from "webpack-dev-server";

interface Configuration extends WebpackConfiguration {
  devServer?: WebpackDevServerConfiguration;
}

export const configuration: Configuration = {
  ...
  devServer: {
    historyApiFallback: true,
    hot: true,
    port: 3000
    ...
  }
  ...
}
````

参考文档：

- [DefinitelyTyped/DefinitelyTyped/issues/27570](https://github.com/DefinitelyTyped/DefinitelyTyped/issues/27570)