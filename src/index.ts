import * as echarts from 'echarts';



// 学历歧视关键字
const super_education = ['985', '211']
// 外包关键字
const suck_blood_words = ['外包', '外派', '劳务派遣', '人力', '驻场', '压力', '加班']
const other_words = ['nextjs', 'next', 'web3', '区块链', 'jquery', '国企']
const key_words = [...super_education, ...suck_blood_words, ...other_words];

// for (let word of key_words) {
//   let regex = new RegExp(`${word}`, "gim");
//   if (regex.test(job_detail)) {
//     job_info.key_words.push(word);
//   }
// }


async function init_charts() {
  const res = await fetch('/data/data.json')
  const jobs = await res.json()
  console.log(jobs);
  
  const total = jobs.length
  // 学历要求
  let zhuanke = 0
  let benke = 0
  let s985211 = 0
  // 急切需要吸血
  let suck_blood_val = 0


  jobs.forEach((job: JobInfo) => {
    if (job.is_discriminate_against) {
      discriminate_against_val += 1
    }
  });

  const pie_option = {
    title: {
      text: '',
      left: 'center'
    },
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'right'
    },
    series: [
      {
        name: 'Access From',
        type: 'pie',
        radius: '50%',
        data: [
          { value: discriminate_against_val, name: '歧视' },
          { value: total-discriminate_against_val, name: '非歧视' },
        ],
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }
    ]
  };

  
  const chart1 = echarts.init(document.querySelector('.chart1') as HTMLElement);
  const option = JSON.parse(JSON.stringify(pie_option))
  option.title.text = '学历要求与歧视'
  chart1.setOption(option)

  const chart12= echarts.init(document.querySelector('.chart1') as HTMLElement);

}

init_charts()