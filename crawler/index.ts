import { By, Builder, Browser, WebElement, WebDriver, until, Key, Actions } from "selenium-webdriver";
import fs from 'fs'

interface Params {
  experience: string
  degree: string
  areaBusiness: string
}

const experience_map = {
  key: 'experience',
  arr: [
    { val: '103', info: '1年以内' },
    { val: '104', info: '1-3年' },
    { val: '105', info: '3-5年' },
  ]
}

const degree_map = {
  key: 'degree',
  arr: [
    { val: '202', info: '大专' },
    { val: '203', info: '本科' },
    { val: '204', info: '硕士' },
  ]
}

const areabussiness_map = {
  key: 'areaBusiness',
  arr: [
    { val: '110101', info: '东城区' },
    { val: '110102', info: '西城区' },
    { val: '110105', info: '朝阳区' },
    { val: '110107', info: '石景山' },
    { val: '110106', info: '丰台区' },
    { val: '110109', info: '门头沟' },
    { val: '110108', info: '海淀区' },
    { val: '110111', info: '房山区' },
    { val: '110113', info: '顺义区' },
    { val: '110112', info: '通州区' },
    { val: '110115', info: '大兴区' },
    { val: '110114', info: '昌平区' },
    { val: '110117', info: '平谷区' },
    { val: '110116', info: '怀柔区' },
    { val: '110119', info: '延庆区' },
    { val: '110118', info: '密云区' },
  ]
}

class Crawler {
  base_url = 'https://www.zhipin.com/web/geek/job'
  driver: WebDriver
  data_file_name = ''
  log_file_name = ''

  params: Params = {
    experience: '103',
    degree: '202',
    areaBusiness: '110101'
  }

  constructor(driver: WebDriver) {
    this.driver = driver
  }

  update_params(params: Params) {
    this.params = params
    this.data_file_name = `${params.areaBusiness}-${params.degree}-${params.experience}`
  }

  generate_url_by_params() {
    // 关键字前端,地区北京
    const query = new URLSearchParams({ ...this.params, query: '前端', city: '101010100' }).toString()
    return `${this.base_url}?${query}`
  }

  // driver获取元素text
  async getTextOrDefault(driver_or_el: WebElement | WebDriver, selector: string, defaultValue: string = ''): Promise<string> {
    try {
      const foundElement = await driver_or_el.findElement(By.css(selector));
      return await foundElement.getText() || defaultValue;
    } catch (error) {
      return defaultValue;
    }
  }

  async get_job_info_by_job_card(job_card: WebElement): Promise<JobInfo> {
    try {
      // 获取卡片上的信息
      const job_name = await this.getTextOrDefault(job_card, 'span.job-name');
      const job_area = await this.getTextOrDefault(job_card, 'span.job-area');
      const salary = await this.getTextOrDefault(job_card, 'span.salary');
      const working_time = await this.getTextOrDefault(job_card, 'ul.tag-list li:nth-child(1)');
      const education = await this.getTextOrDefault(job_card, 'ul.tag-list li:nth-child(2)');
      const boss_name = (await this.getTextOrDefault(job_card, 'div.info-public')).split('\n')[0];
      const boss_job = await this.getTextOrDefault(job_card, 'div.info-public em');
      const company_name = await this.getTextOrDefault(job_card, 'h3.company-name a');
      const company_logo = await job_card.findElement(By.css('div.company-logo img')).getAttribute('src');
      const company_kind = await this.getTextOrDefault(job_card, 'ul.company-tag-list li:nth-child(1)');
      const company_listing = await this.getTextOrDefault(job_card, 'ul.company-tag-list li:nth-child(2)');
      const company_size = await this.getTextOrDefault(job_card, 'ul.company-tag-list li:nth-child(3)');


      const job_info: JobInfo = {
        job_name,
        job_area,
        salary,
        working_time,
        education,
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
      await this.sleep(5000) // 详情页等待

      // 详情页关键字
      job_info.key_words.push(...(await this.getTextOrDefault(this.driver, 'ul.job-keyword-list')).split('\n'))
      const boss_active_time = await this.driver.findElements(By.css('span.boss-active-time'))

      // 活跃状态
      if (boss_active_time.length > 0) {
        job_info.boss_active_time = boss_active_time[0].getText()
      }
      const boss_online = await this.driver.findElements(By.css('span.boss-online-tag'))
      if (boss_online.length > 0) {
        job_info.boss_active_time = '刚刚活跃'
      }


      job_info.detail = await this.getTextOrDefault(this.driver, 'div.job-sec-text');

      await this.driver.close();
      await this.driver.switchTo().window(handles[0]); // 切回列表页

      console.log('------------', job_info);

      return job_info
    } catch (e) {
      console.log('-----------get_job_info-------------------------');
      console.error(e);
      console.log('-----------------------------------------------------------------');
      await this.save_err_log()
      return {
        job_name: 'can_not_find',
        job_area: '',
        salary: '',
        working_time: '',
        education: '',
        boss_name: '',
        boss_job: '',
        company_name: '',
        company_logo: '',
        company_kind: '',
        company_listing: '',
        company_size: '',
        key_words: [],
        boss_active_time: '',
        detail: ''
      }
    }
  }

  async get_jobs_from_page() {
    try {
      const job_cards = await this.driver.findElements(By.css('li.job-card-wrapper'));
      for (let job_card of job_cards) {
        const job = await this.get_job_info_by_job_card(job_card);
        this.save_data(job)
      }
    } catch (e) {
      console.log('-----------get_jobs_from_page-------------------------');
      console.error(e);
      console.log('-----------------------------------------------------------------');
    }
  }

  async create_err_log_file() {
    const currentDate = new Date();
    const year = currentDate.getFullYear()
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0')
    const day = currentDate.getDate().toString().padStart(2, '0')
    const hour = currentDate.getHours().toString().padStart(2, '0')
    const min = currentDate.getMinutes().toString().padStart(2, '0')
    const sec = currentDate.getSeconds().toString().padStart(2, '0')
    this.log_file_name = `${year}_${month}_${day}____${hour}_${min}_${sec}`;

    // 创建日志文件
    await fs.writeFile(`log/${this.log_file_name}.txt`, '', (err) => {
      if (err) {
        console.error('创建错误日志失败:', err);
      }
    });
  }


  async save_err_log() {
    await fs.appendFile(`log/${this.log_file_name}.txt`, `${this.params.areaBusiness}-${this.params.experience}-${this.params.degree}\n`, (err) => {
      if (err) {
        console.error('错误日志写入失败', err);
      }
    });
  }


  async save_data(data: JobInfo) {
    const filePath = `data/${this.data_file_name}.json`;
    if (!fs.existsSync(filePath)) {
      fs.writeFile(`data/${this.data_file_name}.json`, '', (err) => {
        console.log('创建data.json发生错误');
      })
    }
    await fs.appendFile(`data/${this.data_file_name}.json`, JSON.stringify(data, null, 2), (err) => {
      console.log('写入data.json发生错误');
    })
  }


  sleep(timeout: number) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, timeout);
    })
  }


  // 返回值为是否已到达最后一页
  async go_next_page(): Promise<boolean> {
    try {
      const next_page_bt = await this.driver.findElement(By.css('div.options-pages a:last-of-type'))

      if ('disabled' === await next_page_bt.getAttribute('class')) {
        return true
      } else {
        await next_page_bt.click()
        await this.sleep(10000) // 切页后等待
        return false
      }
    } catch (e) {
      console.log('-----------go_next_page-------------------------');
      console.error(e);
      console.log('-----------------------------------------------------------------');
      return true
    }
  }

  // 获取当前参数下的所有页的工作
  async get_jobs_by_current_params() {
    try {
      let is_finished = false
      do {
        await this.get_jobs_from_page();
        is_finished = await this.go_next_page()
      } while (!is_finished)

    }
    catch (e) {
      console.log('-----------get_all_job_by_current_params-------------------------');
      console.error(e);
      console.log('-----------------------------------------------------------------');
    }
  }

  async get_all_job() {
    for (let areaBusiness of areabussiness_map.arr) {
      for (let experience of experience_map.arr) {
        for (let degree of degree_map.arr) {
          const current_params: Params = {
            areaBusiness: areaBusiness.val,
            experience: experience.val,
            degree: degree.val
          }
          this.update_params(current_params)
          this.data_file_name = `${areaBusiness.info}-${experience.info}-${degree.info}`

          const url = this.generate_url_by_params()
          await this.driver.get(url);
          await this.sleep(10000) // 首次进入,等待

          this.get_jobs_by_current_params()
        }
      }
    }
   await this.driver.quit()

  }
}




(async function main() {
    const driver = await new Builder().forBrowser(Browser.CHROME).build();

    const c = new Crawler(driver)
    c.get_all_job()

 
})();
