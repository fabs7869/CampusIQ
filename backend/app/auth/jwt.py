from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.user import User, UserRole
from loguru import logger

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_refresh_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        # Direct console printing for debugging (will show up in your uvicorn terminal)
        print(f"--- TOKEN DECODE --- length: {len(token)} | prefix: {token[:10]}...")
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except JWTError as e:
        print(f"--- TOKEN ERROR --- {str(e)}")
        logger.error(f"JWT Decode Error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate credentials: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    token = credentials.credentials
    print(f"--- GET CURRENT USER --- token_prefix: {token[:10]}...")
    try:
        payload = decode_token(token)
        user_id: str = payload.get("sub")
        print(f"--- GET CURRENT USER --- user_id from token: {user_id}")
        
        if user_id is None:
            print("--- GET CURRENT USER --- user_id is None!")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

        user = db.query(User).filter(User.id == user_id, User.is_active == True).first()
        if user is None:
            print(f"--- GET CURRENT USER --- No active user found for ID: {user_id}")
            logger.warning(f"User not found or inactive for user_id: {user_id}")
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found or inactive")
        
        print(f"--- GET CURRENT USER --- Found user: {user.email}")
        return user
    except Exception as e:
        print(f"--- GET CURRENT USER ERROR --- {str(e)}")
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


def require_role(*roles: UserRole):
    # Standardize roles to their string values for robust comparison
    role_values = [r.value if hasattr(r, 'value') else str(r) for r in roles]
    
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        user_role = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
        
        # Direct console printing for debugging (will show up in your uvicorn terminal)
        print(f"--- AUTH CHECK --- user: {current_user.email} | role: {user_role} | required: {role_values}")
        
        if str(user_role) not in [str(rv) for rv in role_values]:
            logger.warning(f"Access Denied: user={current_user.email}, role={user_role}, required={role_values}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {role_values}. Your role: {user_role}",
            )
        return current_user
    return role_checker


# Shorthand role dependencies
get_student = require_role(UserRole.student)
get_faculty = require_role(UserRole.faculty, UserRole.admin)
get_admin = require_role(UserRole.admin)
get_any_authenticated = require_role(UserRole.student, UserRole.faculty, UserRole.admin)
