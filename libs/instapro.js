import { ObjectId } from "mongodb";
import { connectToDatabase } from "./mongodb";

export async function addPost({ user, description, imageUrl, key }) { // Принимаем данные
  const { db } = await connectToDatabase();

  const comment = {
    createdAt: new Date(),
    imageUrl,
    likes: [],
    description,
    user,
    key,
  };

  await db.collection("instapro_posts").insertOne(comment); // Добавляет данные объекта comment на сервер

  return comment;
}

export async function getPosts({ key, limit = 20 }) {
   // из апи (отсюда) берем данные с сервера(бд) и передаем их в приложение.
  // key - token / limit - лимит на сообщение
  // в одном токене может быть не более 20 постов
  
  const { db } = await connectToDatabase(); // инициализация бд?

  const posts = await db
    .collection("instapro_posts")
    .find({
      key,
    })
    .sort({
      createdAt: -1,
    })
    .limit(limit) // ограничение кол-ва постов
    .toArray();

  return posts;
}

export async function getUserPosts({ key, id, limit = 20 }) {
  // key token - только для того чтобы узнать true like or false. 
  // если не передаем, он по умолчанию всегда false

// id - конкр польз-ля
  const { db } = await connectToDatabase();
  console.log({ id });
  const posts = await db
    .collection("instapro_posts")
    .find({
      key,
      "user._id": new ObjectId(id),
    })
    .sort({
      createdAt: -1,
    })
    .limit(limit)
    .toArray();

  return posts;
}

export async function findPost(id) { 
  // для того чтобы найти конкретный пост по его id исп-ся ф-ия  findPost
  const { db } = await connectToDatabase();

  return db.collection("instapro_posts").findOne({ _id: new ObjectId(id) });
  // находим один пост по конкретному id и возвращает его
}

export async function likePost({ user, id }) { // принимаем user -токен и  id поста
  if (!user) { // если нету токена
    throw new Error("Не передан юзер");
  }

  const post = await findPost(id); // 
  

  if (!post) { // если в пост ничего не записалось или он пустой
    throw new Error("Комментарий не найден");
  }

  const { db } = await connectToDatabase(); // записывает все данные с сервера в { db }

  return db.collection("instapro_posts").updateOne(
    // обновление db , оставляя там только id
    { _id: new ObjectId(id) },
    {
      $set: {
        likes: [
          ...post.likes.filter(({ login }) => user.login !== login),
          user,
        ],
      },
    }
  );
}

export async function dislikePost({ user, id }) {
  if (!user) {
    throw new Error("Не передан юзер");
  }

  const post = await findPost(id);

  if (!post) {
    throw new Error("Комментарий не найден");
  }

  const { db } = await connectToDatabase();

  return db.collection("instapro_posts").updateOne(
    { _id: new ObjectId(id) },
    {
      $set: {
        likes: post.likes.filter(({ login }) => user.login !== login),
      },
    }
  );
}

export function mapPost(post, user) { 
  // ф-ия определяет в каком виде нам вернуться данные в приложении
  return {
    id: post._id,
    imageUrl: post.imageUrl,
    createdAt: post.createdAt,
    description: post.description,
    user: {
      id: post.user._id,
      name: post.user.name,
      login: post.user.login,
      imageUrl: post.user.imageUrl,
    },
    likes: post.likes.map((like) => ({
      id: like._id,
      name: like.name,
    })),
    isLiked: !!post.likes.find((like) => like.login === user?.login),
  };
}

export async function deletePost({ id }) {
  const { db } = await connectToDatabase();

  return db.collection("instapro_posts").deleteOne({ _id: new ObjectId(id) });
}
