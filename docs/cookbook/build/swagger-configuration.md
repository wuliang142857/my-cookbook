---
title: 使用Swagger来构建我们的API文档
date: 2019-12-11 19:59:40
tags:
    - swagger
---

构建API文档的工具其实很多，比如我之前写C++时用得比较多的[doxygen](http://www.doxygen.nl/)、还有我们团队用的比较频繁的[APIDOC](https://apidocjs.com/)。
但整体而言，我还是比较喜欢[Swagger](https://swagger.io/)。

# Swagger在SpringBoot中的配置
总结一下Swagger在SpringBoot中的配置：
## 在pom.xml中增加依赖
````xml
<dependencies>
    <dependency>
      <groupId>io.springfox</groupId>
      <artifactId>springfox-swagger2</artifactId>
      <version>${swagger2.version}</version>
    </dependency>

    <dependency>
      <groupId>io.springfox</groupId>
      <artifactId>springfox-swagger-ui</artifactId>
      <version>${swagger2.version}</version>
    </dependency>
</dependencies>
````
## 配置Configuration
````java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import springfox.documentation.builders.ApiInfoBuilder;
import springfox.documentation.builders.PathSelectors;
import springfox.documentation.builders.RequestHandlerSelectors;
import springfox.documentation.service.ApiInfo;
import springfox.documentation.spi.DocumentationType;
import springfox.documentation.spring.web.plugins.Docket;
import springfox.documentation.swagger2.annotations.EnableSwagger2;

@Configuration
@EnableSwagger2
public class SwaggerConfig {
    @Bean
    public Docket createRestApi() {
        return new Docket(DocumentationType.SWAGGER_2)
            .apiInfo(apiInfo())
            .select()
            // 指定controller存放的目录路径
            .apis(RequestHandlerSelectors.basePackage("com.github.wuliang142857.controllers"))
            .paths(PathSelectors.any())
            .build();
    }

    private ApiInfo apiInfo() {
        return new ApiInfoBuilder()
            .title("wuliang142857")
            .termsOfServiceUrl("https://github.com/wuliang142857/")
            .version("0.0.1")
            .build();
    }
}
````
一般而言，这样配置后就可以了，访问`http://<host>:<port>/swagger-ui.html`就可以看到相应的API文档了。

## 出现Whitelabel Error Page的解决办法
但有时候会出现`Whitelabel Error Page`，解决办法：自定义`swagger-ui.html`等资源的路径。
````java
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
@EnableWebMvc
public class WebConfig implements WebMvcConfigurer {

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/**").addResourceLocations(
            "classpath:/static/");
        registry.addResourceHandler("swagger-ui.html").addResourceLocations(
            "classpath:/META-INF/resources/");
        registry.addResourceHandler("/webjars/**").addResourceLocations(
            "classpath:/META-INF/resources/webjars/");
    }
}
````
