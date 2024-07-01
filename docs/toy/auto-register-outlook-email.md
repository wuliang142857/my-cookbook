---
icon：outlook
---

# 一种自动注册Outlook邮箱的方法

## 先看最终的效果

<video width="100%" height="480" controls>   
    <source src="https://unpkg.com/@wuliang142857/cdn-faker@0.1.8/auto-register-outlook-email/part-01.mp4" type="video/mp4">   
</video>

# 具体思路

难点主要在于人机交互的验证码这步，之前看到一个项目[Exploited7/outlook-account-creator](https://github.com/Exploited7/outlook-account-creator) 说是支持通过[Capsolver](https://www.capsolver.com/) 或者 [CapBypass](https://capbypass.com/) 来解决验证码的问题。我试一下，说是验证码解决了，但最后一步的注册还是失败了。因为这个项目它是纯调接口的，因此那会我一时半会也没弄明白它为啥还是失败了。

不过，这个过程中也给了一个启发，既然这些自动打码服务说是可以解决验证码，我何不试试。

我安装了[Capsolver](https://www.capsolver.com/) 的Chrome插件后，手动注册一个Outlook邮箱，发现它果然可以帮我自动识别验证码。

这样，就给我了我一个灵感，我用[selenium](https://www.selenium.dev/) 或者 [playwright](https://playwright.dev/python/docs/intro) 启动一个浏览器，然后启动时带上 [Capsolver](https://www.capsolver.com/) 的Chrome插件（Edge也可以用），然后不就可以完整自动注册了嘛。

正好之前还看到一个项目[imlee2021/AutoReg4MSChatGPT](https://github.com/imlee2021/AutoReg4MSChatGPT)有一个注册Outlook邮箱的Python脚本：[AutoRegOutlook.py](https://github.com/imlee2021/AutoReg4MSChatGPT/blob/main/AutoRegOutlook.py)，这个脚本除了验证码外，其他都搞定了。我就基于它稍微改了一下：

1. 删除了无痕模式

```python
options.add_argument("--inprivate")
```

2. 添加了启动时带上Capsolver的插件

```python
options.add_argument(f'--user-data-dir=/Users/admin/Downloads/chrome_user_data')
options.add_argument(f'--load-extension=/Users/admin/Downloads/CapSolver')
```

其中:

- `/Users/admin/Downloads/CapSolver`是把[capsolver/capsolver-browser-extension](https://github.com/capsolver/capsolver-browser-extension)下载下来后的解压文件。
- 指定`--user-data-dir`的目的在于[Capsolver](https://www.capsolver.com/) 的访问需要API Key，指定用户数据目录的话，就不需要每次都输入这个API Key了。

最后的完整代码：

```python
import csv
import random
import time

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.options import Options
from selenium.webdriver.edge.service import Service
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.webdriver.support.ui import WebDriverWait
from webdriver_manager.microsoft import EdgeChromiumDriverManager

def shuffle(arr):
    random.shuffle(arr)
    return arr


def register(prefix, password, first_name, last_name, year, month, day):
    options = Options()
    options.add_argument(f'--user-data-dir=/Users/admin/Downloads/chrome_user_data')
    options.add_argument(f'--load-extension=/Users/admin/Downloads/CapSolver')
    service = Service(executable_path=EdgeChromiumDriverManager().install())
    driver = webdriver.Edge(service=service, options=options)
    driver.get(
        'https://signup.live.com/newuser.aspx?contextid=A34663E86ABA02E6&uiflavor=web&lic=1&mkt=EN-US&lc=1033&uaid'
        '=412e188e23334594ad53f1a33880cf67')
    driver.implicitly_wait(20)
    driver.find_element(By.ID, 'liveSwitch').click()
    driver.find_element(By.NAME, 'MemberName').send_keys(prefix)  # Email
    driver.find_element(By.ID, 'iSignupAction').click()
    driver.implicitly_wait(20)
    driver.find_element(By.ID, 'PasswordInput').send_keys(password)  # Password
    driver.find_element(By.ID, 'iSignupAction').click()
    driver.implicitly_wait(20)
    driver.find_element(By.NAME, 'FirstName').send_keys(first_name)
    driver.find_element(By.NAME, 'LastName').send_keys(last_name)
    driver.find_element(By.ID, 'iSignupAction').click()
    driver.implicitly_wait(20)

    # Choosing Birth Month
    opt = driver.find_element(By.XPATH, '//*[@id="BirthMonth"]')
    dropdown = Select(opt)
    dropdown.select_by_index(month)
    # Choosing Birth Day
    opt = driver.find_element(By.XPATH, '//*[@id="BirthDay"]')
    dropdown = Select(opt)
    dropdown.select_by_index(day)
    # Typing in Birth Year
    driver.find_element(By.XPATH, '//*[@id="BirthYear"]').send_keys(year)
    driver.find_element(By.ID, 'iSignupAction').click()

    # 最多等待10分钟
    element = WebDriverWait(driver, 10 * 60).until(
        EC.presence_of_element_located((By.ID, "piplConsentContinue"))
    )
    element.click()

    return driver


# 随机生成生日年份
def random_brith_year():
    return random.randint(1980, 2003)


# 随机生成生日月份
def random_brith_month():
    months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
    return shuffle(months)[0]


# 随机生成生日日期
def random_brith_day():
    days = [1, 3, 6, 12, 16, 20, 25, 26, 2]
    return shuffle(days)[0]


# 随机生成FirstName
def random_firstname():
    first_name = ['John', 'James', 'Robert', 'Michael', 'William', 'David', 'Richard', 'Charles', 'Joseph', 'Thomas',
                  'Christopher', 'Daniel', 'Paul', 'Mark', 'Donald', 'George', 'Kenneth', 'Steven', 'Edward', 'Brian',
                  'Ronald', 'Anthony', 'Kevin', 'Jason', 'Matthew', 'Gary', 'Timothy', 'Jose', 'Larry', 'Jeffrey',
                  'Frank', 'Scott', 'Eric']
    return shuffle(first_name)[0]


# 随机生成LastName
def random_lastname():
    last_name = ['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor',
                 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez',
                 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez',
                 'King', 'Wright', 'Lopez', 'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter',
                 'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans', 'Edwards',
                 'Collins']
    return shuffle(last_name)[0]


# 随机生成16位密码
def random_password():
    password = ''.join(random.choice('abcdefghijklmnopqrstuvwxyz0123456789') for _ in range(16))
    return password


# 随机生成 16位邮箱前缀
def random_email_prefix():
    char = random.choice('abcdefghijklmnopqrstuvwxyz')
    # 邮箱前缀必须以字母开头
    prefix = char + ''.join(random.choice('abcdefghijklmnopqrstuvwxyz0123456789') for _ in range(15))
    return prefix


def main():
    while True:
        prefix = random_email_prefix()
        password = random_password()
        first_name = random_firstname()
        last_name = random_lastname()
        year = random_brith_year()
        month = random_brith_month()
        day = random_brith_day()

        driver = None
        try:
            driver = register(prefix, password, first_name, last_name, year, month, day)
            print(prefix + '@outlook.com', password)
            with open('outlook.csv', 'a', newline='') as csv_file:
                writer = csv.writer(csv_file)
                writer.writerow([prefix + '@outlook.com', password])
        except Exception as e:
            print(f"Error: {e}")
            continue
        finally:
            if driver is not None:
                try:
                    driver.quit()
                except Exception as ex:
                    print("Error occurred while quitting: ", ex)
        time.sleep(3)


if __name__ == '__main__':
    main()

```

# 写到最后

不知道为什么，我在实际用的浏览器中每次注册邮箱只需要二步验证码，但这个脚本，每次需要经过十步验证，虽然每步都是CapSolver帮我通过的，但CapSolver本身是按此收费的，因此这一个账号注册下来比直接买来得贵。

另外，估计也是因为每次注册需要多次验证，[Exploited7/outlook-account-creator](https://github.com/Exploited7/outlook-account-creator) 才没有注册成功的，因为它每次只解决一次验证码。





