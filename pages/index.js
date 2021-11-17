import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { useState, useEffect } from 'react'
import Auth from '../components/Auth'
import Chat from '../components/Chat'



export default function Home({ session, supabase, currentUser }) {
  const [loggedIn, setLoggedIn] = useState(false)

  useEffect(() => {
    setLoggedIn(!!session)
  }, [session])

  return (
    <div className={styles.container}>
      <Head>
        <title>Supabase Chat App</title>
      </Head>

      <main className={styles.main}>
        {loggedIn ? <Chat session={session} supabase={supabase} currentUser={currentUser} /> : <Auth supabase={supabase} />}
      </main>


    </div>
  )
}
