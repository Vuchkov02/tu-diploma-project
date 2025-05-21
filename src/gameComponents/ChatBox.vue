<template>
  <div class="chat-container">
    <div class="chat-messages" :class="{ hidden: messages.length === 0 }">
      <div v-for="(msg, index) in messages" :key="index">
        <strong>{{ msg.player.name }}:</strong> {{ msg.message }}
      </div>
    </div>
    <input
      :value="newMessage"
      @input="
        $emit('update:newMessage', ($event.target as HTMLInputElement)?.value)
      "
      @keyup.enter="sendMessage"
      :disabled="gameEnded || isDrawer"
      placeholder="Type a message..."
    />
    <div v-if="isDrawer" class="drawer-warning">
      ✋ You are the drawer. You can't chat this round.
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  messages: { player: { name: string }; message: string }[];
  newMessage: string;
  sendMessage: () => void;
  isDrawer: boolean;
  gameEnded: boolean;
}>();

defineEmits(["update:newMessage"]);
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  margin-bottom: 8px;
  padding: 8px;
  background-color: #fafafa;
  border: 1px solid #ddd;
  border-radius: 6px;
  max-height: 200px;
}

input {
  padding: 6px;
  border-radius: 4px;
  border: 1px solid #ccc;
}

input[disabled] {
  background-color: #f0f0f0;
  color: #999;
}
.hidden {
  display: none;
}

.drawer-warning {
  font-size: 12px;
  color: #e53935;
  margin-top: 4px;
}
</style>
