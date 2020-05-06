<template>
  <div style="position: absolute; bottom: 0px; z-index: 5; width: 100%; display: flex; align-items: start; max-width: 40%; overflow: scroll; max-height: 50%; left: 30%">
    <b-alert :show="dismissCountDown" v-html="message" dismissible variant="warning" @dismissed="dismissCountDown = 0" @dismiss-count-down="countDownChanged" />
  </div>
</template>

<script>
import { MessageEventBus } from '../../Constants.ts';

export default {
  name: 'MessageModal',
  data() {
    return {
      dismissSecs: 4,
      dismissCountDown: 0,
      message: '',
    };
  },
  mounted() {
    MessageEventBus.$on('showMessage', message => {
      this.showAlert(message);
    });
  },
  methods: {
    countDownChanged(dismissCountDown) {
      this.dismissCountDown = dismissCountDown;
    },
    showAlert(message) {
      if (this.dismissCountDown > 0) {
        this.message += '<br>' + message;
      } else {
        this.message = message;
      }
      this.dismissCountDown = this.dismissSecs;
    },
  },
};
</script>
