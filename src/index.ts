import axios from "axios";
import { log } from "console";

const instance = axios.create({
  baseURL: 'https://www.zhipin.com/',
  timeout: 1000,
  headers: {
    "user-agent": 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
    "Token": 'aGpC7fCSccs7BXv',
    "Referer": 'https://www.zhipin.com/web/geek/job-recommend?city=101010100&jobType=1901',
    "Cookie": "lastCity=101010100; ab_guid=59cb1c4e-1255-48b3-b32f-947965454cc1; __zp_seo_uuid__=a84270cf-199e-4dd1-844c-9c7f354255bb; Hm_lvt_194df3105ad7148dcf2b98a91b5e727a=1730493397,1731393254; Hm_lpvt_194df3105ad7148dcf2b98a91b5e727a=1731393254; HMACCOUNT=9AFC425AA4573B71; wt2=DMZxSHR7UziWSwiBqfomTWFoZdKzsnlsAgoLJS6xxmWx9bCJ3_XBVsjml6s7DnLtNPyWJm1YSyzJEVflcyK9tHg~~; wbg=0; zp_at=29rB5jQBa6c7tAjUtm2PO6cotQgWkQpRtaIhVO3C3b0~; __g=-; __l=r=http%3A%2F%2F127.0.0.1%3A5500%2F&l=%2Fwww.zhipin.com%2Fweb%2Fcommon%2F404.html&s=1&g=&s=3&friend_source=0; __fid=dfc70fa1f2603cbdef5dace02aa98c70; __c=1731393254; __a=32851949.1730493397.1730493397.1731393254.23.2.15.23; bst=V2SdkmEuH_015gXdJqzR4QIS-w7D_XwQ~~|SdkmEuH_015gXdJqzR4QIS-w7DrTxw~~"
  }
})


async function getAllJob() {
  let pageSizeGet = 1;
  let page = 1;
  const jobs = [];

  try {
    // 使用 `do-while` 来保证至少运行一次
    do {
      const url = `/wapi/zpgeek/pc/recommend/job/list.json?city=101010100&experience=&payType=&partTime=&degree=&industry=&scale=&salary=&jobType=&encryptExpectId=&mixExpectType=&page=${page}&pageSize=15`
      // const url = `wapi/zpgeek/pc/recommend/job/list.json?city=101010100&experience=&payType=&partTime=&degree=&industry=&scale=&salary=&jobType=1901&encryptExpectId=&mixExpectType=&page=${page}&pageSize=15`;
      
      const res = await instance.get(url);
      console.log(res);
      
      const joblist = res.data.zpData.jobList;
      console.log(joblist);
      
      
      jobs.push(...joblist);
      pageSizeGet = joblist.length;
      page++; // 增加页数，获取下一页
    } while (pageSizeGet > 0);

    return jobs;
  } catch (error) {
    console.error("Error fetching jobs:", error);
    throw error;
  }
}

// 调用 `getAllJob` 并输出结果
getAllJob().then(res => {
  console.log(res.length);
}).catch(error => {
  console.error("Error in getAllJob:", error);
});
