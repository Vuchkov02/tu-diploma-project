<template>
    <div class="chat-container">
      <div class="chat-messages">
        <div v-for="msg in messages" :key="msg.id">
          <strong>{{ msg.player.name }}:</strong> {{ msg.message }}
        </div>
      </div>
      <input v-model="newMessage" @keyup.enter="sendMessage" placeholder="Type a message..." />
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        socket: io("http://localhost:5000"),
        newMessage: "",
        messages: []
      };
    },
    methods: {
      sendMessage() {
        if (this.newMessage.trim()) {
          this.socket.emit("send_message", { roomId: this.$route.params.roomId, player: { name: this.$store.state.username }, message: this.newMessage });
          this.newMessage = "";
        }
      }
    },
    mounted() {
      this.socket.on("receive_message", (msg) => {
        this.messages.push(msg);
      });
    }
  };
  </script>
  