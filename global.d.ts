export {}

declare global {

  interface JobInfo {
    job_name: string
    job_area: string
    salary: string
    working_time: string
    education: string
    boss_name: string
    boss_job: string
    company_name: string
    company_logo: string
    company_kind: string
    company_listing: string
    company_size: string
    key_words: string[]
    boss_active_time: string
    detail: string
  }
}