import { HTMLProps } from "react";
import styles from "../styles/textArea.module.css";

export default function TextArea({...rest}: HTMLProps<HTMLTextAreaElement>){ //dessa forma eu permito que esse componente use todas as propriedades de um elemento textarea html comum
    return(
        <textarea className={styles.textarea} {...rest}></textarea>
    );
}