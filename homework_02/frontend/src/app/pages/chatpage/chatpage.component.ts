import {Component, ElementRef, OnInit, ViewChild} from '@angular/core';
import {SocketClient} from "../../service/socket-client";
import {Message} from "../../interfaces/interfaces";
import {Utils} from "../../service/utils";
import {Subscription} from "rxjs";

const messages: Message[] = [
  {
    username: 'alinus',
    message: 'Lorem ipsum dolor sit amed',
    date: new Date(),
  },
  {
    username: 'valstam',
    message: 'Lorem ipsum dolor sit amed',
    date: new Date(),
  },
  {
    username: 'claurentiu',
    message: 'Lorem ipsum dolor sit amed',
    date: new Date(),
  },
];

@Component({
  selector: 'app-chatpage',
  templateUrl: './chatpage.component.html',
  styleUrls: ['./chatpage.component.scss']
})
export class ChatPageComponent implements OnInit {

  messages: Message[] = [];
  username: string;

  updateMessagesSubscription: Subscription = {} as any;

  @ViewChild('messageContainer') messageContainer: ElementRef = {} as ElementRef;

  constructor(private socketClient: SocketClient) {
    const existingUsername = localStorage.getItem("username");

    if (existingUsername == null) {
      this.username = Utils.generateId(16);
      localStorage.setItem("username", this.username);
      return;
    }

    this.username = existingUsername;
  }

  ngOnInit(): void {
    this.updateMessagesSubscription = this.socketClient.updateMessagesEvent.subscribe((data) => {
      this.fetchMessages(data);
    });

    this.socketClient.sendGetMessages();
  }

  onSendMessage(event: Event, form: HTMLFormElement, input: HTMLInputElement) {
    event.preventDefault();

    const messageObject: Message = {
      username: this.username,
      message: input.value,
      date: new Date(),
    }

    if (messageObject.message === '') {
      return;
    }

    this.socketClient.sendMessage(messageObject);

    this.socketClient.sendGetMessages();
  }

  fetchMessages(messages: Message[]) {
    this.messages = JSON.parse(JSON.stringify(messages));
    this.messages.reverse();
  }

  onSetUsername(username: string) {
    this.username = username;
    localStorage.setItem("username", this.username);
    location.href = '/';
  }

}
