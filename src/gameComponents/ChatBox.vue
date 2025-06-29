<template>
  <div class="chat-box">
    <div ref="chatContainer" class="chat-messages">
      <div
        v-for="(msg, index) in props.messages"
        :key="index"
        class="chat-message"
      >
        <template v-if="msg.player.system">
          <span class="system-message"
            >🎉 {{ msg.player.name }} {{ msg.message }}</span
          >
        </template>
        <template v-else>
          <strong>{{ msg.player.name }}:</strong> {{ msg.message }}
        </template>
      </div>
    </div>

    <div v-if="props.isDrawer" class="chat-blocked-message">
      ✋ You are the drawer. You can't chat this round.
    </div>

    <input
      v-else
      class="chat-input"
      :value="props.newMessage"
      @input="
        emit('update:newMessage', ($event.target as HTMLInputElement)?.value)
      "
      @keyup.enter="props.sendMessage"
      :disabled="props.gameEnded"
      placeholder="Type a message..."
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";

const props = defineProps<{
  messages: { player: { name: string; system?: boolean }; message: string }[];
  newMessage: string;
  sendMessage: () => void;
  isDrawer: boolean;
  gameEnded: boolean;
}>();

const emit = defineEmits(["update:newMessage"]);

const chatContainer = ref<HTMLElement | null>(null);

watch(
  () => props.messages,
  () => {
    nextTick(() => {
      if (chatContainer.value) {
        chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
      }
    });
  },
  { deep: true }
);
</script>

<style scoped>
.chat-box {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #121212;
  border-radius: 12px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
  overflow: hidden;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  font-size: 14px;
  color: #e0e0e0;
  background: rgba(255, 255, 255, 0.02);
  scrollbar-width: thin;
  scrollbar-color: #94f8d0 transparent;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}
.chat-messages::-webkit-scrollbar-thumb {
  background-color: #94f8d0;
  border-radius: 6px;
}

.chat-message {
  word-break: break-word;
  margin-bottom: 8px;
}
.chat-message strong {
  color: #c99cff;
}

.system-message {
  color: #94f8d0;
  font-weight: bold;
}

.chat-input {
  background-color: #1e1e1e;
  border-top: 1px solid #333;
  padding: 10px;
  font-size: 14px;
  border: none;
  outline: none;
  color: #fff;
  width: 100%;
  box-sizing: border-box;
  transition: background 0.2s;
}
.chat-input::placeholder {
  color: #aaa;
}
.chat-input:focus {
  background-color: #2a2a2a;
}

.chat-blocked-message {
  padding: 10px;
  font-size: 14px;
  text-align: center;
  color: #ff5c5c;
  background-color: rgba(255, 92, 92, 0.1);
  font-weight: bold;
  border-top: 1px solid #333;
}
</style>
