import { GetStaticProps } from 'next';
import Head from 'next/head'
import Image from "next/image";
import styles from "@/styles/home.module.css";
import brainstormImg from "../assets/brainstorm.png";
import {collection, getDocs} from "firebase/firestore";
import {db} from "../services/firebaseConnection";

interface HomeProps{
  posts: number;
  comments: number;
}

export default function Home({posts, comments}: HomeProps) {
  return (
    <div className={styles.container}>
      <Head>
        <title>Taskboard+</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className={styles.main}>

        <div className={styles.homeContent}>
          <Image className={styles.homeImg} alt="Brainstorm" src={brainstormImg} priority /> {/*o elemento Image nativo do Next.js possui um atributo priority, que prioriza o carregamento dessa imagem ante a todo o resto*/}
        </div>

        <h1 className={styles.homeTitle}>A place to think out of the box with the whole world. <br /> Think. Share. Collab.</h1>

        <div className={styles.homeStats}>
          <section className={styles.statsBox}>
            <span>+{posts} posts</span>
          </section>
          <section className={styles.statsBox}>
            <span>+{comments} comments</span>
          </section>
        </div>

      </main>
    </div>
  )
}

export const getStaticProps: GetStaticProps = async () => {
  const commentsRef = collection(db, "comments");
  const commentSnapshot = await getDocs(commentsRef);

  const postsRef = collection(db, "tasks");
  const postsSnapshot = await getDocs(postsRef);

  return{
    props: {
      posts: postsSnapshot.size || 0,
      comments: commentSnapshot.size || 0, //usando o condicional ou ||, caso venha undefined (no caso de não ter nenhum comentário, por exemplo), ele retorna a alternativa, que seria o zero
    },
    revalidate: 60, //vai fazer a conexão com o banco de dados e atualizar os números a cada 60 segundos, ou seja, a cada 1 minuto (quando passar 1 minuto, o próximo usuário que entrar no site vai atualizar os números, depois não atualiza mais até que se passe mais 1 minuto)
  }
}
