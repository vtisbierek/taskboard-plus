import {useSession, signIn, signOut} from "next-auth/react";
import styles from "../styles/header.module.css";
import Link from "next/link";

export default function Header(){
    const {data: session, status} = useSession();

    return (
        <header className={styles.header}>
            <section className={styles.section}>
                <nav className={styles.nav}>
                    <Link href="/" >
                        <h1 className={styles.logo}>
                            Taskboard<span>+</span>
                        </h1>
                    </Link>

                    {session?.user && (
                        <Link href="/dashboard" >
                            <p className={styles.myPanel}>My Panel</p>
                        </Link>
                    )}
                    
                </nav>

                {status === "loading" ? (
                    <></>
                ) : session ? (
                    <button className={styles.loginBtn} onClick={() => signOut()} >Hello {session?.user?.name}</button>
                ) : (
                    <button className={styles.loginBtn} onClick={() => signIn("google")} >Login</button>
                )}
                
            </section>
        </header>
    );
}