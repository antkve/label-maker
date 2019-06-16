from flask import Flask, render_template, send_from_directory, request, session
import mysql.connector
from parse import parse
import os

mydb = mysql.connector.connect(
        host="localhost",
        user="root",
        passwd="password",
        database="sys"
        )
mycursor = mydb.cursor(buffered=True)
app = Flask(__name__, template_folder="templates")
app.secret_key = 'arrdeveldddpp114ofacrft'
app.config['SESSION_TYPE'] = 'filesystem'


@app.route('/res/<path:path>')
def res(path):
    return send_from_directory('res', path)


@app.route('/diagrams/<path:path>')
def diagrams(path):
    return send_from_directory('diagrams', path)


@app.route('/unlabeled/<path:path>')
def unlabeled(path):
    return send_from_directory('unlabeled', path)


@app.route('/delete', methods=['GET', 'POST'])
def delete():
    if request.method == "POST":
        img_id = request.form['img_id']
        os.rename("unlabeled/{}.jpg".format(img_id), "discarded/{}.jpg".format(img_id))
        return "Deleted."


def sql_get_user_number(user_id):
    mycursor.execute("SELECT * FROM clothing WHERE submitter=%s", (user_id,))
    res = mycursor.fetchall()
    return len(res)

@app.route('/main')
def main():
    print("MAIN CALLED")
    try:
        img_id = min(os.listdir("unlabeled"), key=(lambda x: int(x.split('.')[0]))).split('.')[0]
        user_number = sql_get_user_number(session['user_id']) if 'user_id' in session else 0
        return render_template("labelmaker.html", img_id=img_id, user_number=user_number)
    except ValueError:
        return render_template("nomore.html")


def sql_insert(img_id, category, landmarks, username):
    mycursor.execute("INSERT INTO clothing (img_id, category, landmarks, submitter) VALUES (%s, %s, %s, %s)", (img_id, category, landmarks, username))
    mydb.commit()

@app.route('/store', methods=['GET', 'POST'])
def store():
    print("STORE CALLED")
    if request.method == "POST":
        img_id = request.form['img_id']
        category = request.form['category']
        landmarks = request.form['landmarks']
        username = request.form['username']
        sql_insert(img_id, category, landmarks, username)
        session['user_id'] = username
        os.rename(
                "unlabeled/{}.jpg".format(img_id),
                "labeled/{}.jpg".format(img_id)
                )

        return "Done."


if __name__ == "__main__":
    app.run(debug=True)
