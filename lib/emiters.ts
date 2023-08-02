import Events from "events"

const emiters = {
    userEmiter: new Events(),
    messageEmmiter:new Events(),
    authenticationEmiter:new Events(),
    conversationEmiter:new Events()

}


export default emiters

