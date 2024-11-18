const { By, Builder, Browser, WebElement } = require('selenium-webdriver');
const key_word = ['git', 'npm', 'vue', 'Vue', 'Vue3', 'react', "React", 'js', 'javascript']

function get_job_normal(job){

}

(async function firstTest() {
  let driver;

  let page = 1
  let page_max = 10
  const job_list = []

  try {
    driver = await new Builder().forBrowser(Browser.CHROME).build();
    await driver.manage().setTimeouts({ implicit: 5000 });

    do {

      let url = `https://www.zhipin.com/web/geek/job?query=%E5%89%8D%E7%AB%AF&city=101010100&experience=103,104&degree=203&jobType=1901&areaBusiness=110105&page=${page}`
      await driver.get(url);

      let job_el_list_page = await driver.findElements(By.className('job-card-wrapper'));


      let job = job_el_list_page[0]
      // for (let job of job_list_page) {
        let job_text = await job.getText()
        let job_text_arr = job_text.split('\n')
        let salary = job_text_arr[2].slice(0, -1).split('-')
        let job_info = {
          job_name: job_text_arr[0],
          location: job_text_arr[1],
          salary_min: salary[0],
          salary_max: salary[1],
          year: job_text_arr[3], // 要求年限
          education_level: job_text_arr[4], // 学历要求
          company: job_text_arr[6],
          scope: job_text_arr[7],
          request: job_text_arr[8],
          welfare: job_text_arr[9]
        }
        job_list.push(job_info)
        await job.click()
      // }

      page += 1

    } while (page <= page_max)

    console.log(job_list);
    console.log(job_list.length);


  } catch (e) {
    console.log('错误!!!', e)
  } finally {
    // await driver.quit();
  }
}())