import { By, Builder, Browser, WebElement, WebDriver, until } from "selenium-webdriver";
import fs from 'fs'
// import Chrome from 'selenium-webdriver/chrome'


interface Params {
  experience: string
  degree: string
  areaBusiness: string
}

interface M {
  key: string
  value: {
    [k in string]: string
  }
}

const experience_map: M = {
  key: 'experience',
  value: {
    103: '1年以内',
    104: '1-3年',
    105: '3-5年',
  }
}

const degree_map: M = {
  key: 'degree',
  value: {
    202: '大专',
    203: '本科',
    204: '硕士',
  }
}

const areabussiness_map: M = {
  key: 'areaBusiness',
  value: {
    110101: '东城区',
    110102: '西城区',
    110105: '朝阳区',
    110107: '石景山',
    110106: '丰台区',
    110109: '门头沟',
    110108: '海淀区',
    110111: '房山区',
    110113: '顺义区',
    110112: '通州区',
    110115: '大兴区',
    110114: '昌平区',
    110117: '平谷区',
    110116: '怀柔区',
    110119: '延庆区',
    110118: '密云区',
  }
}

class Crawler {
  base_url = 'https://www.zhipin.com/web/geek/job'
  driver: WebDriver
  data_file_name = ''
  log_file_name = ''

  params: Params = {
    experience: '',
    degree: '',
    areaBusiness: ''
  }

  constructor(driver: WebDriver) {
    this.driver = driver
  }

  update_params(params: Params) {
    this.params = params
  }

  generate_url_by_params() {
    // 关键字前端,地区北京
    const query = new URLSearchParams({ ...this.params, query: '前端', city: '101010100' }).toString()
    return `${this.base_url}?${query}`
  }


  async wait_el_visable(selector: string, el_father: WebDriver | WebElement = this.driver, save_error = true): Promise<WebElement | null> {
    const timeout = 5000

    try {
      const el_located = until.elementLocated(By.css(selector))
      await this.driver.wait(el_located, timeout);

      const el = await el_father.findElement(By.css(selector))

      const el_visable = until.elementIsVisible(el)
      await this.driver.wait(el_visable, timeout);
      return el
    } catch (err) {
      console.error(`---Element "${selector}" not found or timeout`, err);
      if (!save_error) {
        await this.save_err_log(`selector not found ${selector}`)
      }
      return null
    }
  }

  async getTextOrDefault(selector: string, el_father: WebElement | WebDriver = this.driver): Promise<string> {
    const el = await this.wait_el_visable(selector, el_father)
    return el === null ? '' : el.getText()
  }

  async get_job_info_by_job_card(job_card: WebElement, job_info_list: JobInfo[]) {
    try {
      // 获取卡片上的信息
      const job_name = await this.getTextOrDefault('span.job-name', job_card);
      const areaBusiness = await this.getTextOrDefault('span.job-area', job_card);
      const salary = await this.getTextOrDefault('span.salary', job_card);
      const experience = await this.getTextOrDefault('ul.tag-list li:nth-child(1)', job_card);
      const degree = await this.getTextOrDefault('ul.tag-list li:nth-child(2)', job_card);
      const boss_job = await this.getTextOrDefault('div.info-public em', job_card);
      const boss_info = (await this.getTextOrDefault('div.info-public', job_card)).split('\n')[0];
      const boss_name = boss_info.split(boss_job)[0]
      const company_name = await this.getTextOrDefault('h3.company-name a', job_card);
      const company_logo = await job_card.findElement(By.css('div.company-logo img')).getAttribute('src');


      let company_kind = ''
      let company_listing = '无阶段'
      let company_size = ''

      const company_info = await job_card.findElements(By.css('ul.company-tag-list li'))
      if (company_info.length === 3) {
        company_kind = await company_info[0].getText()
        company_listing = await company_info[1].getText()
        company_size = await company_info[2].getText()
      }
      else {
        company_kind = await company_info[0].getText()
        company_size = await company_info[1].getText()
      }

      const job_info: JobInfo = {
        job_name,
        areaBusiness,
        salary,
        experience,
        degree,
        boss_name,
        boss_job,
        company_name,
        company_logo,
        company_kind,
        company_listing,
        company_size,
        key_words: [],
        boss_active_time: '',
        detail: ''
      };




      // 获取详情页上的信息
      await job_card.click();
      const handles = await this.driver.getAllWindowHandles();
      await this.driver.switchTo().window(handles[1]); // 切换详情页标签
      await this.driver.sleep(3000)

      // console.log('--------------', await this.driver.getCurrentUrl());


      await this.wait_el_visable('ul.job-keyword-list') // 关键字el
      await this.wait_el_visable('div.job-detail-section div.job-sec-text:nth-child(4)') // 详情el

      const key_words_text = await this.getTextOrDefault('ul.job-keyword-list')
      const key_words = key_words_text.split('\n')

      job_info.key_words.push(...key_words)

      const boss_active_time = await this.driver.findElements(By.css('span.boss-active-time'))
      if (boss_active_time.length > 0) {
        job_info.boss_active_time = boss_active_time[0].getText()
      }
      const boss_online = await this.driver.findElements(By.css('span.boss-online-tag'))
      if (boss_online.length > 0) {
        job_info.boss_active_time = '刚刚活跃'
      }

      job_info.detail = await this.getTextOrDefault('div.job-detail-section div.job-sec-text:nth-child(4)');


      // 切回列表页
      await this.driver.close();
      await this.driver.switchTo().window(handles[0]);
      await this.driver.sleep(1000)

      job_info_list.push(job_info)
      console.log('------current params get job: ', job_info_list.length);

    } catch (e) {
      await this.save_err_log()
      console.error('---get_job_info', e);
    }
  }

  async get_jobs_from_page(job_info_list: JobInfo[]) {
    try {
      await this.wait_el_visable('ul.job-list-box li.job-card-wrapper:nth-child(1)')

      const job_cards = await this.driver.findElements(By.css('ul.job-list-box li.job-card-wrapper'));
      for (let job_card of job_cards) {
        await this.get_job_info_by_job_card(job_card, job_info_list);
      }
    } catch (e) {
      console.error('-----------get_jobs_from_page', e);
    }
  }

  create_log_file() {
    const currentDate = new Date();
    const year = currentDate.getFullYear()
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const day = currentDate.getDate().toString().padStart(2, '0')
    const hour = currentDate.getHours().toString().padStart(2, '0')
    const min = currentDate.getMinutes().toString().padStart(2, '0')
    const sec = currentDate.getSeconds().toString().padStart(2, '0')
    this.log_file_name = `${year}_${month}_${day}____${hour}_${min}_${sec}`;

    try {
      fs.writeFileSync(`log/${this.log_file_name}.txt`, '')
    } catch (e) {
      console.error('create log fail', e);
    }
  }


  async save_err_log(info_ex: string = '') {
    const url = await this.driver.getCurrentUrl()
    const info = `
      ${url}
      ${areabussiness_map.value[this.params.areaBusiness]}-${experience_map.value[this.params.experience]}-${degree_map.value[this.params.degree]}
      ${info_ex}
      `
    try {
      fs.appendFileSync(`log/${this.log_file_name}.txt`, info)
    } catch (e) {
      console.error('----write log fail', e);
    }
  }


  save_data(data: {
    experience: string
    degree: string
    areaBusiness: string
    jobs: JobInfo[]
  }) {
    try {
      fs.writeFileSync(`data/${this.data_file_name}.json`, JSON.stringify(data, null, 2))
    } catch (e) {
      console.error('save data fail error', e);
    }
  }


  // async sleep(timeout: number) {
  //   await this.driver.sleep(timeout)
  //   // return new Promise((resolve, reject) => {
  //   // setTimeout(resolve, timeout);
  //   // })
  // }


  // 返回值为是否已到达最后一页
  async go_next_page(): Promise<boolean> {
    try {
      const next_page_bt = await this.wait_el_visable('div.options-pages a:last-of-type')
      if (next_page_bt === null) {
        return true
      }
      await this.hide_login_dialog()

      const bt_class_name = await next_page_bt.getAttribute('class')
      const is_disabled = bt_class_name.includes('disabled');


      if (is_disabled) {
        return true
      } else {
        await next_page_bt.click()
        await this.wait_el_visable('ul.job-list-box li.job-card-wrapper:nth-child(1)')
        await this.driver.sleep(3000)
        return false
      }
    } catch (e) {
      await this.save_err_log()
      console.error('-----------go_next_page', e);
      return true
    }
  }

  // 获取当前参数下的所有页的job
  async get_jobs_by_current_params() {
    let is_finished = false
    const job_info_list: JobInfo[] = []
    do {
      await this.get_jobs_from_page(job_info_list);
      is_finished = await this.go_next_page()
    } while (!is_finished)

    this.save_data({
      experience: this.params.experience,
      degree: this.params.degree,
      areaBusiness: this.params.areaBusiness,
      jobs: job_info_list
    })
  }

  async hide_login_dialog() {
    await this.wait_el_visable('div.boss-login-dialog', this.driver, false)
    await this.driver.executeScript(`
        const dialog = document.querySelector('div.boss-login-dialog');
        if(dialog !== null) {
          dialog.style.display = 'none';
        }
      `);
  }


  async get_all_job() {
    this.create_log_file()

    for (let [areaBusiness_key, areaBusiness_info] of Object.entries(areabussiness_map.value)) {
      for (let [experience_key, experience_info] of Object.entries(experience_map.value)) {
        for (let [degree_key, degree_info] of Object.entries(degree_map.value)) {
          const current_params: Params = {
            areaBusiness: areaBusiness_key,
            experience: experience_key,
            degree: degree_key
          }
          this.update_params(current_params)
          this.data_file_name = `${areaBusiness_info}-${experience_info}-${degree_info}`

          const url = this.generate_url_by_params()
          console.log('---------new params-----------');

          await this.driver.get(url);
          await this.driver.sleep(3000)
          await this.hide_login_dialog()

          // 空页判断
          try {
            const res = await this.wait_el_visable('ul.job-list-box li.job-card-wrapper:nth-child(1)')
            if (res === null) continue

            await this.get_jobs_by_current_params()
          } catch (e) {
            console.error('--------------get_all_job', e);
          }
        }
      }
    }
    this.driver.quit()
  }
}




(async function main() {
  // const options = new Chrome.Options();
  // options.addArguments('--user-agent=CustomUserAgent/1.0');


  const driver = await new Builder()
    .forBrowser(Browser.CHROME)
    .build();

  const c = new Crawler(driver)
  c.get_all_job()

})();
