import React, { FC, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Peer from 'peerjs';

interface CreateRoomFormProps {
  uuid: () => string;
  socket: any;
  setUser: (user: any) => void;
  setMyPeer: (peer: Peer) => void;
}

const CreateRoomForm: FC<CreateRoomFormProps> = ({
  uuid,
  socket,
  setUser,
  setMyPeer,
}) => {
  const [roomId, setRoomId] = useState<string>(uuid());
  const [name, setName] = useState<string>('');

  const navigate = useNavigate();

  const handleCreateRoom = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const myPeer = new Peer( {
      host: '/',
      port: 5001,
      path: '/',
      secure: false,
    });

    setMyPeer(myPeer);

    myPeer.on('open', (id: string) => {
      const roomData = {
        name,
        roomId,
        userId: id,
        host: true,
        presenter: true,
      };
      setUser(roomData);
      navigate(`/${roomId}`);
      console.log(roomData);
      socket.emit('userJoined', roomData);
    });
    myPeer.on('error', (err: any) => {
      console.log('peer connection error', err);
      myPeer.reconnect();
    });
  };

  return (
    <form className="form col-md-12 mt-5" onSubmit={handleCreateRoom}>
      <div className="form-group">
        <input
          type="text"
          className="form-control my-2"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>
      <div className="form-group border">
        <div className="input-group d-flex align-items-center jusitfy-content-center">
          <input
            type="text"
            value={roomId}
            className="form-control my-2 border-0"
            disabled
            placeholder="Generate room code"
          />
          <div className="input-group-append">
            <button
              className="btn btn-primary btn-sm me-1"
              onClick={() => setRoomId(uuid())}
              type="button"
            >
              generate
            </button>
            <button
              className="btn btn-outline-danger btn-sm me-2"
              type="button"
            >
              copy
            </button>
          </div>
        </div>
      </div>
      <button
        type="submit"
        className="mt-4 btn-primary btn-block form-control"
      >
        Generate Room
      </button>
    </form>
  );
};

export default CreateRoomForm;