import { useState, useEffect, useRef } from "react"

const Chat = ({ session, supabase, currentUser }) => {
    if (!currentUser) return null;

    const [messages, setMessages] = useState([])
    const message = useRef('')
    const [editing, setEditing] = useState(false)
    const newUsername = useRef('')
    const [users, setUsers] = useState({})

    useEffect(async () => {
        const getMessages = async () => {
            let { data: messages, error } = await supabase
                .from('messages')
                .select('*')

            setMessages(messages)
        }

        await getMessages()

        const setupMessagesSubscription = async () => {
            await supabase
                .from('messages')
                .on('INSERT', payload => {
                    setMessages(previous => [...previous, payload.new])
                })
                .subscribe()
        }

        await setupMessagesSubscription()

        const setupUsersSubscription = async () => {
            await supabase
                .from('user')
                .on('UPDATE', payload => {
                    setUsers(users => {
                        const user = users[payload.new.id]
                        if (user) {
                            return Object.assign({}, users, { [payload.new.id]: payload.new })
                        } else {
                            return users
                        }
                    })
                })
        }
    }, [])

    const sendMessage = async evt => {
        evt.preventDefault()

        const content = message.current.value
        await supabase.from('messages').insert([
            { content, user_id: session.user.id }
        ])

        message.current.value = ''
    }

    const logout = evt => {
        evt.preventDefault()
        window.localStorage.clear()
        window.location.reload()
    }

    const setUsername = async evt => {
        evt.preventDefault()
        const username = newUsername.current.value
        await supabase.from('user').upsert([
            { ...currentUser, username }
        ])

        newUsername.current.value = ''
        setEditing(false)
    }

    const getUsersFromSupabase = async (users, userIds) => {
        const usersToGet = Array.from(userIds).filter(userId => !users[userId])
        if (Object.keys(users).length && usersToGet.length === 0) return users

        const { data } = await supabase.from('user').select('id, username').in('id', usersToGet)

        const newUsers = {}
        data.forEach(user => newUsers[user.id] = user)

        return Object.assign({}, users, newUsers)
    }

    useEffect(async () => {
        const getUsers = async () => {
            const userIds = new Set(messages.map(message => message.user_id))
            const newUsers = await getUsersFromSupabase(users, userIds)
            setUsers(newUsers)
        }

        await getUsers()
    }, [messages])

    const username = user_id => {
        const user = users[user_id]
        if (!user) return null
        return user.username ? user.username : user.id
    }

    return (
        <>
            <div>
                <h1>Supabase Chat</h1>
                <p>Welcome, {currentUser?.username ? currentUser.username : session?.user?.email}</p>
                <div>
                    {editing ? (
                        <form onSubmit={setUsername}>
                            <input placeholder="New username" required ref={newUsername} />
                            <button>Set username</button>
                        </form>) : (<div>
                            <button onClick={() => setEditing(true)}>Edit username</button>
                            <button onClick={evt => logout(evt)}>Log out</button>
                        </div>)}
                </div>
            </div>

            <div>
                {messages.map(message =>
                    <div key={message.id} style={{ display: "flex" }}>
                        <span>{username(message.user_id)}</span>
                        <div>{message.content}</div>
                    </div>)}
            </div>

            <form onSubmit={sendMessage}>
                <input placeholder="Write your messsage" required ref={message} />
                <button>Send Message</button>
            </form>
        </>
    )
}

export default Chat