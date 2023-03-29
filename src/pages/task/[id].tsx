import { GetServerSideProps, GetStaticProps } from "next";
import Head from "next/head";
import styles from "../../styles/task.module.css";
import {useSession} from "next-auth/react";
import {doc, getDoc, addDoc, collection, query, where, orderBy, onSnapshot, deleteDoc} from "firebase/firestore";
import {db} from "../../services/firebaseConnection";
import TextArea from "@/components/TextArea";
import {ChangeEvent, FormEvent, useState, useEffect} from "react";
import {FaTrash} from "react-icons/fa";

interface TaskProps{
    taskInfo: {
        content: string;
        authorId: string;
        authorName: string;
        date: string;
        taskId: string;
    }
}

interface CommentProps{
    id: string;
    comment: string;
    created: Date;
    user: string;
    name: string;
    taskId: string;
}

export default function Task({taskInfo}: TaskProps){
    const [comment, setComment] = useState("");
    const [commentList, setCommentList] = useState<CommentProps[]>([]);
    const {data: session} = useSession();

    useEffect(() => {
        async function loadComments(){
            const collectionRef = collection(db, "comments");
            const q = query(
                collectionRef,
                orderBy("created", "desc"), //estou ordenando a minha busca pela propriedade created, e o "desc" significa que vai em ordem decrescente
                where("taskId", "==", taskInfo?.taskId) //e quero filtrar minha busca apenas para os comentários relacionados à essa task específica
            );

            onSnapshot(q, (snapshot) => {  //essa função onSnapshot do firebase é real-time, ou seja, sempre que eu adicionar ou deletar um item na collection, ele vai executar
                let resultList = [] as CommentProps[];

                snapshot.forEach(item => {
                    resultList.push({
                        id: item.id,
                        taskId: item.data().taskId,
                        created: item.data().created,
                        user: item.data().user,
                        name: item.data().name,
                        comment: item.data().comment,
                    });
                });

                console.log(resultList);
                

                setCommentList(resultList);
            });
        }

        loadComments();

    }, [taskInfo?.taskId]);

    async function handleRegisterComment(event: FormEvent<HTMLFormElement>){
        event.preventDefault();

        if(comment === "") return; //se a variável de estado que guarda o comment estiver vazia, retorna sem fazer nada, pra barrar o registro de um commment em branco
        
        if(!session?.user) return; //fazendo uma nova verificação, se não tiver usuário logado, não deixa comentar

        try{  
            await addDoc(collection(db, "comments"), {
                comment: comment,
                created: new Date(),
                user: session?.user?.email,
                name: session?.user?.name,
                taskId: taskInfo?.taskId,
            });
            
            setComment(""); //após registrar meu novo comment, zera o campo

        }catch(err){
            console.log(err);     
        }
    }

    async function handleDeleteComment(id: string){
        const docRef = doc(db, "comments", id);

        await deleteDoc(docRef);
    }

    return(
        <div className={styles.container}>
            <Head>
                <title>Taskboard+ | Public task</title>
            </Head>

            <main className={styles.main}>
                <h1>{taskInfo?.authorName}&apos;s Task</h1>
                <article className={styles.task}>
                    <p>
                        {taskInfo?.content}
                    </p>
                </article>
            </main>

            <section className={styles.commentsContainer}>
                <h2>Leave a comment</h2>

                <form onSubmit={handleRegisterComment} >
                    <TextArea
                        placeholder="Type in your comment..."
                        value={comment}
                        onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setComment(event.target.value)}
                    />
                    <button className={styles.commentBtn} disabled={!session?.user} >Send comment</button>
                </form>
            </section>

            <section className={styles.commentsContainer}>
                <h2>All Comments</h2>
                {commentList.length === 0 ? (
                    <span>No comments yet</span>
                ) : 
                    commentList.map(item => (
                        <article className={styles.comment} key={item.id}>
                            <div className={styles.commentTags}>
                                <label className={styles.nameTag}>{item.name}</label>
                                {item.user === session?.user?.email && (
                                    <button className={styles.deleteTag} onClick={() => handleDeleteComment(item.id)} >
                                        <FaTrash size={18} color="#cd0066" />
                                    </button>
                                )} 
                            </div>
                            <p>{item.comment}</p>
                        </article>
                    ))
                }
            </section>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
    const id = context.query.id as string;
    const docRef = doc(db, "tasks", id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        if(docSnap.data()?.public){
            return({
                props: {
                    taskInfo: {
                        content: docSnap.data()?.task,
                        authorId: docSnap.data()?.user,
                        authorName: docSnap.data()?.name,
                        date: new Date(docSnap.data()?.created.seconds * 1000).toLocaleDateString("en-GB"), //a propriedade created no meu banco de dados tá salva como created: Timestamp { seconds: 1680036254, nanoseconds: 202000000 }, e o tipo Date de JS usa milisegundos, então tenho que pegar os secondos e multiplicar por 1000 para resultar em milisegundos
                        taskId: id,
                    },
                }
            });
        } else{
            return ({ //se tentarem acessar uma task que não seja pública (digitando manualmente um id de uma task não pública), manda pra home
                redirect: {
                    destination: "/",
                    permanent: false,
                }
            });   
        }
    } else {
    // doc.data() will be undefined in this case
        return ({ //se a pessoa digitou um id inexistente, vai pra erro 404
            redirect: {
                destination: "/404",
                permanent: false,
            }
        });
    }
};