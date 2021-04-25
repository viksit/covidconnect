import Head from 'next/head'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <div className={styles.container}>
      <Head>
        <title>CovidConnect</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          CovidConnect
        </h1>

        <p className={styles.description}>
          A CovidFYI.in initiative. This site crawls Twitter and shows supply and demand for various resources like Oxygen, beds and ICUs.
        </p>

        <h3> Also see </h3>
        <a href="" className={styles.card}>
          <h3>Documentation</h3>
          <p className={styles.code}>
            https://covidconnect.vercel.app/api/data?city=delhi&resource_type=demand<br/>
            https://covidconnect.vercel.app/api/data?city=delhi&resource_type=supply<br/>
          </p>
        </a>
        
        <div className={styles.grid}>
          <a href="http://covidfyi.in/" className={styles.card}>
            <h3>CovidFYI.in</h3>
            <p>Search resources</p>
          </a>
          <a href="https://indiacovidresources.in/" className={styles.card}>
            <h3>India Covid Resources</h3>
            <p>Centralized database of resources</p>
          </a>
        </div>
      </main>

      <footer className={styles.footer}>
        Built by &nbsp;<a href="https://twitter.com/viksit">@viksit</a>. Please reach out to contribute.
      </footer>
    </div>
  )
}
