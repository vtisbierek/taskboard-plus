import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string, //se vc der o hover com o mouse em cima do nome da variável de ambiente, vai ver que aparece como 'string | undefined', então eu coloco as string pra dizer explicitamente que vai char string, não undefined
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        })
    ],
    secret: process.env.JWT_SECRET as string,
};

export default NextAuth(authOptions);