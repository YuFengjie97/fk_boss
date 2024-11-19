import { By, Builder, Browser, WebElement, WebDriver, until, Key, Actions } from "selenium-webdriver";
import fs from 'fs'


// 学历歧视关键字
const super_education = ['985', '211']
// 外包关键字
const suck_blood_words = ['外包', '外派', '劳务派遣', '人力', '驻场', '压力', '加班']
const other_words = ['nextjs', 'next', 'web3', '区块链', 'jquery', '国企']
const key_words = [...super_education, ...suck_blood_words, ...other_words];


const experience_map = {
  key: 'experience',
  arr: [
    { val: 103, info: '1年以内' },
    { val: 104, info: '1-3年' },
    { val: 105, info: '3-5年' },
  ]
}

const degree_map = {
  key: 'degree',
  arr: [
    { val: 202, info: '大专' },
    { val: 203, info: '本科' },
    { val: 204, info: '硕士' },
  ]
}

const areabussiness_map = {
  key: 'areaBusiness',
  arr: [
    { val: 110101, info: '东城区' },
    { val: 110102, info: '西城区' },
    { val: 110105, info: '朝阳区' },
    { val: 110107, info: '石景山' },
    { val: 110106, info: '丰台区' },
    { val: 110109, info: '门头沟' },
    { val: 110108, info: '海淀区' },
    { val: 110111, info: '房山区' },
    { val: 110113, info: '顺义区' },
    { val: 110112, info: '通州区' },
    { val: 110115, info: '大兴区' },
    { val: 110114, info: '昌平区' },
    { val: 110117, info: '平谷区' },
    { val: 110116, info: '怀柔区' },
    { val: 110119, info: '延庆区' },
    { val: 110118, info: '密云区' },
  ]
}


function generate_url(params: any) {
  // 关键字前端,地区北京
  const base_url = 'https://www.zhipin.com/web/geek/job'
  const query = new URLSearchParams({ ...params, query: '前端', city: '101010100' }).toString()
  return `${base_url}?${query}`
}


// 提取元素文本，如果未找到则返回默认值
async function getTextOrDefault(driver_or_el: WebElement | WebDriver, selector: string, defaultValue: string = ''): Promise<string> {
  try {
    const foundElement = await driver_or_el.findElement(By.css(selector));
    return await foundElement.getText() || defaultValue;
  } catch (error) {
    return defaultValue;
  }
}

// 点击卡片获取详细信息
async function get_job_info(driver: WebDriver, job_card: WebElement): Promise<JobInfo> {
  try {
    // 获取卡片上的信息
    const job_name = await getTextOrDefault(job_card, 'span.job-name');
    const job_area = await getTextOrDefault(job_card, 'span.job-area');

    // 获取薪资
    let salary = 0;
    const salaryStr = await getTextOrDefault(job_card, 'span.salary');
    if (salaryStr) {
      const arr = salaryStr.split('K')[0].split('-');
      const min = Number(arr[0]);
      const max = Number(arr[1]);
      salary = (max - min) / 2 + min;
    }

    // 获取其他信息
    const working_time = await getTextOrDefault(job_card, 'ul.tag-list li:nth-child(1)');
    const education = await getTextOrDefault(job_card, 'ul.tag-list li:nth-child(2)');
    const boss_name = (await getTextOrDefault(job_card, 'div.info-public')).split('\n')[0];
    const boss_job = await getTextOrDefault(job_card, 'div.info-public em');
    const company_name = await getTextOrDefault(job_card, 'h3.company-name a');
    const company_logo = await job_card.findElement(By.css('div.company-logo img')).getAttribute('src');
    const company_kind = await getTextOrDefault(job_card, 'ul.company-tag-list li:nth-child(1)');
    const company_listing = await getTextOrDefault(job_card, 'ul.company-tag-list li:nth-child(2)');
    const company_size = await getTextOrDefault(job_card, 'ul.company-tag-list li:nth-child(3)');


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
      boss_active_time: ''
    };


    // 获取详情页上的信息
    await job_card.click();
    const handles = await driver.getAllWindowHandles();
    await driver.switchTo().window(handles[1]); // 切换详情页标签
    await sleep(5000) // 详情页等待

    // 详情页关键字
    job_info.key_words.push(...(await getTextOrDefault(driver, 'ul.job-keyword-list')).split('\n'))
    const boss_active_time = await driver.findElements(By.css('span.boss-active-time'))

    // 活跃状态
    if (boss_active_time.length > 0) {
      job_info.boss_active_time = boss_active_time[0].getText()
    }
    const boss_online = await driver.findElements(By.css('span.boss-online-tag'))
    if (boss_online.length > 0) {
      job_info.boss_active_time = '刚刚活跃'
    }


    // 详情页详细信息自定义关键字过滤
    const job_detail = await getTextOrDefault(driver, 'div.job-sec-text');
    for (let word of key_words) {
      let regex = new RegExp(`${word}`, "gim");
      if (regex.test(job_detail)) {
        job_info.key_words.push(word);
      }
    }


    await driver.close();
    await driver.switchTo().window(handles[0]); // 切回列表页

    console.log('------------', job_info);

    return job_info
  } catch (e) {
    console.log('-----------get_job_info-------------------------');
    console.error(e);
    console.log('-----------------------------------------------------------------');
    return {
      job_name: '',
      job_area: '',
      salary: 0,
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
      boss_active_time: ''
    }
  }

}


// 获取当前页的所有卡片信息
async function get_job_card_from_page(driver: WebDriver, job_list: JobInfo[]) {
  try {
    const job_cards = await driver.findElements(By.css('li.job-card-wrapper'));
    for (let job_card of job_cards) {
      const job = await get_job_info(driver, job_card);
      job_list.push(job);
      console.log('get_job', job_list.length);
    }
  } catch (e) {
    console.log('-----------get_job_card_from_page-------------------------');
    console.error(e);
    console.log('-----------------------------------------------------------------');
  }
}


function save_data(data: JobInfo[], filename: string) {
  try {
    fs.writeFile(`data/${filename}.json`, JSON.stringify(data, null, 2), (err) => {
      if (err) {
        console.error('写入文件时发生错误:', err);
      } else {
        console.log('数据成功写入');
      }
    });
  } catch (e) {
    console.log('-----------save_data-------------------------');
    console.error(e);
    console.log('-----------------------------------------------------------------');
  }
}

function sleep(timeout: number) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, timeout);
  })
}

async function go_next_page(driver: WebDriver): Promise<boolean> {
  console.log('-------next_page-------');
  // await driver.executeScript(`
  //   let last_card = document.querySelector('.job-list-box .job-card-wrapper:nth-last-child(2)')
  //   last_card.scrollIntoView()
  // `)
  try {
    const next_page_bt = await driver.findElement(By.css('div.options-pages a:last-of-type'))

    if ('disabled' === await next_page_bt.getAttribute('class')) {
      return true
    } else {
      await next_page_bt.click()
      await sleep(5000) // 切页后等待
      return false
    }
  } catch (e) {
    console.log('-----------go_next_page-------------------------');
    console.error(e);
    console.log('-----------------------------------------------------------------');
    return true
  }
}

async function get_all_job_by_current_params(driver: WebDriver, save_file_name: string) {
  try {
    let is_finished = false
    const job_list: JobInfo[] = []

    do {
      await get_job_card_from_page(driver, job_list);
      is_finished = await go_next_page(driver)
    } while (!is_finished)

    save_data(job_list, save_file_name)
  }
  catch (e) {
    console.log('-----------get_all_job_by_current_params-------------------------');
    console.error(e);
    console.log('-----------------------------------------------------------------');
  }
}

(async function main() {

  const driver: WebDriver = await new Builder().forBrowser(Browser.CHROME).build();

  try {

    for (let areaBusiness of areabussiness_map.arr) {
      for (let experience of experience_map.arr) {
        for (let degree of degree_map.arr) {
          const url = generate_url({
            areaBusiness: areaBusiness.val,
            experience: experience.val,
            degree: degree.val
          })
          await driver.get(url);
          await sleep(5000) // 首次进入,等待
          const flag_el = await driver.findElement(By.css('ul.job-list-box .job-card-wrapper:nth-child(1)'))
          await driver.wait(until.elementIsVisible(flag_el), 10000);

          const save_file_name = `${areaBusiness.info}-${experience.info}-${degree.info}`
          get_all_job_by_current_params(driver, save_file_name)
        }
      }
    }

  } catch (e) {
    console.log('-----------get_all_job_by_current_params-------------------------');
    console.error(e);
    console.log('-----------------------------------------------------------------');
  }
})();
