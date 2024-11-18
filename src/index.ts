import { By, Builder, Browser, WebElement, WebDriver, until } from "selenium-webdriver";
import fs from 'fs'

interface JobInfo {
  job_name: string;
  location: string;
  salary_min: number;
  salary_max: number;
  year: string;
  education_level: string;
  company: string;
  scope: string;
  request: string;
  welfare: string;
  key_words: string[];
  logo: string;
}

const key_words = ['web', 'app', 'html5', 'git', 'npm', 'vue', 'vue2', 'Vue3', 'react', 'js', 'javascript', '外包', '外派', '劳务派遣', '人力', '驻场', '压力'];

async function get_job(driver: WebDriver, job_card: WebElement): Promise<JobInfo> {
  let job_text = await job_card.getText();
  let job_text_arr = job_text.split('\n');
  let salary = job_text_arr[2].split('K')[0].split('-');
  let job_info: JobInfo = {
    job_name: job_text_arr[0],
    location: job_text_arr[1],
    salary_min: salary[0] ? Number(salary[0]) : 0,
    salary_max: salary[1] ? Number(salary[1]) : 0,
    year: job_text_arr[3], // 要求年限
    education_level: job_text_arr[4], // 学历要求
    company: job_text_arr[6],
    scope: job_text_arr[7],
    request: job_text_arr[8],
    welfare: job_text_arr[9],
    key_words: [],
    logo: ''
  };

  try {
    await job_card.click();
    const handles = await driver.getAllWindowHandles();
    await driver.switchTo().window(handles[1]);
    
    await driver.wait(until.elementLocated(By.css('div.company-info img')), 10000);
    const logo = await driver.findElement(By.css('div.company-info img'));
    job_info.logo = await logo.getAttribute('src');

    const job_detail = await driver.findElement(By.className('job-sec-text'));
    const detail = await job_detail.getText();

    for (let word of key_words) {
      let regex = new RegExp(`${word}`, "gim");
      if (regex.test(detail)) {
        job_info.key_words.push(word);
      }
    }

  } catch (e) {
    console.error('Error fetching job details:', e);
  } finally {
    await driver.close();
    const handles = await driver.getAllWindowHandles();
    await driver.switchTo().window(handles[0]);
  }

  return job_info;
}

async function get_job_card_from_page(driver: WebDriver, page: number): Promise<WebElement[]> {
  let url = `https://www.zhipin.com/web/geek/job?query=%E5%89%8D%E7%AB%AF&city=101010100&experience=103,104&degree=203&jobType=1901&areaBusiness=110105&page=${page}`;
  await driver.get(url);
  const job_cards = await driver.findElements(By.className('job-card-wrapper'));
  return job_cards;
}

function save_data(data: JobInfo[]){
  fs.writeFile('data/data.json', JSON.stringify(data, null, 2), (err) => {
    if (err) {
      console.error('写入文件时发生错误:', err);
    } else {
      console.log('数据成功写入到 data.json');
    }
  });
}

(async function main() {
  let page = 1;
  const page_max = 1;
  const driver: WebDriver = await new Builder().forBrowser(Browser.CHROME).build();
  await driver.manage().setTimeouts({ implicit: 5000 });

  const job_list: JobInfo[] = [];
  
  try {
    do {
      let job_cards = await get_job_card_from_page(driver, page);
      for (let job_card of job_cards) {
        const job = await get_job(driver, job_card);
        job_list.push(job);
      }
      page += 1;
    } while (page <= page_max);
  } catch (e) {
    console.log('Error!', e);
  } finally {
    await driver.quit(); // 退出浏览器
    save_data(job_list)
    console.log('Job list:', job_list);
  }
})();
