import requests

def test_api():
    try:
        # Check health endpoint
        res = requests.get("http://localhost:8000/api/health")
        print("Health status code:", res.status_code)
        print("Health response JSON:", res.json())
        
        # Test creating a game
        res_create = requests.post("http://localhost:8000/api/games", json={
            "name": "Test Game",
            "gridSize": 4,
            "timerDuration": 15
        })
        print("Create game status code:", res_create.status_code)
        game_data = res_create.json()
        print("Create game response JSON:", game_data)
        game_code = game_data.get("id")
        
        # Join player 1
        res_join1 = requests.post(f"http://localhost:8000/api/games/{game_code}/join", json={
            "name": "Player 1",
            "gameCode": game_code
        })
        print("Player 1 join status:", res_join1.status_code)
        if res_join1.status_code != 200:
            print("Player 1 join error response:", res_join1.text)
            return
        p1_data = res_join1.json()
        print("Player 1 details:", p1_data.get("player"))
        print("Player 1 card:", p1_data.get("card"))
        
        # Join player 2
        res_join2 = requests.post(f"http://localhost:8000/api/games/{game_code}/join", json={
            "name": "Player 2",
            "gameCode": game_code
        })
        print("Player 2 join status:", res_join2.status_code)
        p2_data = res_join2.json()
        print("Player 2 details:", p2_data.get("player"))
        print("Player 2 card:", p2_data.get("card"))
        
        # Delete test game
        # First login as admin
        res_login = requests.post("http://localhost:8000/api/admin/login", json={
            "username": "admin",
            "password": "password123"
        })
        print("Admin login status:", res_login.status_code)
        token = res_login.json().get("access_token")
        
        res_del = requests.delete(
            f"http://localhost:8000/api/games/{game_code}",
            headers={"Authorization": f"Bearer {token}"}
        )
        print("Delete game status:", res_del.status_code)
        print("Delete game response:", res_del.json())
        
        print("\nAll API calls executed successfully!")
    except Exception as e:
        print("Error during test:", e)

if __name__ == "__main__":
    test_api()
