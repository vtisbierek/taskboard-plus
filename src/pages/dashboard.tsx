import styles from "../styles/dashboard.module.css";
import Head from "next/head";
import { GetServerSideProps } from "next";
import {getSession} from "next-auth/react";
import TextArea from "@/components/TextArea";
import {FiShare2} from "react-icons/fi";
import {FaTrash} from "react-icons/fa";
import {ChangeEvent, FormEvent, useState, useEffect} from "react";
import {db} from "../services/firebaseConnection";
import {addDoc, collection, query, orderBy, where, onSnapshot, doc, deleteDoc} from "firebase/firestore";
import Link from "next/link";

interface DashboardProps{ //aqui eu interfaceio o meu tipo user que eu criei lá embaixo, dizendo que é um objeto e dentro desse objeto tem uma propriedade chamada email que é do tipo string
    user: {
        email: string;
        name: string;
    }
}

interface TaskProps{ //estou interfaceando o tipo que vai ser recebido no objeto de estado taskList
    id: string;
    task: string;
    created: Date;
    user: string;
    name: string;
    public: boolean;
}

export default function Dashboard({user}: DashboardProps){ //eu preciso indicar qual é o tipo da propriedade "user" que eu tô passando (que peguei do servidor lá embaixo), e pra isso preciso criar o tipo DashboardProps com uma interface
    const [input, setInput] = useState("");
    const [publicTask, setPublicTask] = useState(false);
    const [taskList, setTaskList] = useState<TaskProps[]>([]); //ao colocar <TaskProps[]> ao lado de useState, eu estou dizendo que esse cara vai ser um array de objetos do tipo TaskProps, que eu interfaceei ali em cima

    useEffect(() => {
        async function loadTasks(){
            const collectionRef = collection(db, "tasks");
            const q = query(
                collectionRef,
                orderBy("created", "desc"), //estou ordenando a minha busca pela propriedade created, e o "desc" significa que vai em ordem decrescente
                where("user", "==", user?.email) //e quero filtrar minha busca para os resultados onde a propriedade "user" seja igual ao user.email que está em sessão no momento
            );

            onSnapshot(q, (snapshot) => {  //essa função onSnapshot do firebase é real-time, ou seja, sempre que eu adicionar ou deletar um item na collection, ele vai executar
                let resultList = [] as TaskProps[];

                snapshot.forEach(item => {
                    resultList.push({
                        id: item.id,
                        task: item.data().task,
                        created: item.data().created,
                        user: item.data().user,
                        name: item.data().name,
                        public: item.data().public,
                    });
                });

                setTaskList(resultList);
            });
        }

        loadTasks();

    }, [user?.email]);

    function handleChangePublic(event: ChangeEvent<HTMLInputElement>){
        setPublicTask(event.target.checked);
    }

    async function handleRegisterTask(event: FormEvent){ //é assíncrona pois vou interagir com o banco de dados aqui dentro
        event.preventDefault();

        if(input === "") return; //se a variável de estado que guarda o input estiver vazia, retorna sem fazer nada, pra barrar o registro de uma task vazia
       
        try{  
            await addDoc(collection(db, "tasks"), {
                task: input,
                created: new Date(),
                user: user?.email,
                name: user?.name,
                public: publicTask,
            });
            
            setInput(""); //após registrar minha nova task, eu limpo o campo do textarea novamente
            setPublicTask(false); //da mesma forma, desmarco o checkbox de tornar a task pública

        }catch(err){
            console.log(err);     
        }
    }

    async function handleShare(id: string){
        await navigator.clipboard.writeText(`
            ${process.env.NEXT_PUBLIC_URL}/task/${id}
        `);

        alert("Task URL copied to clipboard!");
    }

    async function handleDeleteTask(id: string){
        const docRef = doc(db, "tasks", id);

        await deleteDoc(docRef);
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Taskboard+ | Taskboard Panel</title>
            </Head>

            <main className={styles.main}>
                <section className={styles.newTask}>
                    <div className={styles.newTaskForm}>
                        <h1 className={styles.newTaskTitle}>
                            What is on your mind?
                        </h1>
                        <form onSubmit={handleRegisterTask}>
                            <TextArea
                                placeholder="Type in your new task..."
                                value={input}
                                onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setInput(event.target.value)} //com TypeScript eu tenho que explicitamente declarar os tipos das variáveis, então tenho que dizer que esse event é do tipo change event do elemento html textarea
                            />
                            <div className={styles.checkboxArea}>
                                <input
                                    type="checkbox"
                                    className={styles.checkbox}
                                    checked={publicTask}
                                    onChange={handleChangePublic}
                                />
                                <label>Make the task public</label>
                            </div>
                            <button type="submit" className={styles.newTaskBtn}>Add task</button>
                        </form>
                    </div>
                </section>

                <section className={styles.taskListSection}>
                    <h1>My Tasks</h1>

                    {taskList.map(item => (
                        <article key={item.id} className={styles.task}>
                            {item.public && (
                                <div className={styles.tagContainer}>
                                    <label className={styles.tag}>PUBLIC</label>
                                    <button className={styles.shareButton} onClick={() => handleShare(item.id)} >
                                        <FiShare2 size={22} color="#0066cd" />
                                    </button>
                                </div>
                            )}
                            
                            <div className={styles.taskContent}>
                                {item.public ? (
                                    <Link href={`/task/${item.id}`} >
                                        <p>{item.task}</p>
                                    </Link>
                                ) : (
                                    <p>{item.task}</p>
                                )}
                                

                                <button className={styles.deleteButton} onClick={() => handleDeleteTask(item.id)} >
                                    <FaTrash size={24} color="#cd0066" />
                                </button>
                            </div>
                        </article>
                    ))}  
                </section>
            </main>
        </div>
    );
}

export const getServerSideProps: GetServerSideProps = async ({req}) => { //essa função getServerSideProps sempre é executada no lado do servidor, e não no client, tanto é que o console.log aí abaixo vai aparecer no terminal, e não no console do navegador
    const session = await getSession({req});
    //console.log(session);

    if(!session?.user){ //ou seja, se não tem nenhum usuário em sessão, redireciona pra home
        return ({
            redirect: {
                destination: "/",
                permanent: false,
            }
        });
    }
    
    return ({ //essa função pode retornar props do lado do servidor pra serem usados na hora de renderizar o front, porém nesse caso eu n quero prop nenhum, só estou usando ela pra barrar o acesso caso não tem usuário em sessão, então se tiver eu retorno um objeto vazio e não uso ele pra nada e só monto a minha tela de dashboard normal (é que nessa função é obrigatório ter um return)
        props: {
            user: { //estou enviando a propriedade "user" com o email do usuário que está com sessão aberta
                email: session?.user?.email,
                name: session?.user?.name,
            }
        },
    });
};